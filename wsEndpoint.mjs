export { WsEndpoint };

import * as os from 'os';
import { TextEncoder, TextDecoder } from './EncodeDecode.mjs';

const enc = new TextEncoder();
const dec = new TextDecoder();
const MAX_PAYLOAD = 1024 * 1000;

function concatUint8( a, b ){
	const r = new Uint8Array( a.length + b.length );
	r.set( a, 0 );
	r.set( b, a.length );
	return r;
}

function closeFrame( code, reason, masked ){
	const reasonBuf = enc.encode( reason );
	const payload = new Uint8Array( 2 + reasonBuf.length );
	payload[0] = ( code >> 8 ) & 0xFF;
	payload[1] = code & 0xFF;
	payload.set( reasonBuf, 2 );
	return wsFrame( 0x8, payload, masked );
}

function closeTcp( fds, dispatch ){
	if( !dispatch ) os.setReadHandler( fds[ 0 ], null );
	os.close( fds[ 0 ] ); os.close( fds[ 1 ] );
	fds[ 0 ] = fds[ 1 ] = -1;
}

function wsFrame( opcode, payload, masked ) {
	const payloadLen = payload.length;
	const FIN = 0x80;
	const MASK = masked ? 0x80 : 0x00;
	const headerLen = ( payloadLen < 126
		? 2
		: payloadLen <= 0xFFFF
			? 4
			: 10
	) + ( masked ? 4 : 0 );

	const buf = new Uint8Array( headerLen + payloadLen );
	let offset = 0;

	buf[offset++] = FIN | opcode;

	if ( payloadLen < 126 ) {
		buf[offset++] = MASK | payloadLen;
	} else if ( payloadLen <= 0xFFFF ) {
		buf[offset++] = MASK | 126;
		buf[offset++] = ( payloadLen >> 8 ) & 0xFF;
		buf[offset++] = payloadLen & 0xFF;
	} else {
		buf[offset++] = MASK | 127;
		buf[offset++] = 0; buf[offset++] = 0; buf[offset++] = 0; buf[offset++] = 0;
		buf[offset++] = ( payloadLen >>> 24 ) & 0xFF;
		buf[offset++] = ( payloadLen >>> 16 ) & 0xFF;
		buf[offset++] = ( payloadLen >>> 8 )  & 0xFF;
		buf[offset++] = payloadLen & 0xFF;
	}

	if( masked ){
		const maskKey = [
			( Math.random() * 256 ) | 0,
			( Math.random() * 256 ) | 0,
			( Math.random() * 256 ) | 0,
			( Math.random() * 256 ) | 0
		];
		buf[offset++] = maskKey[0];
		buf[offset++] = maskKey[1];
		buf[offset++] = maskKey[2];
		buf[offset++] = maskKey[3];

		for ( let i = 0; i < payloadLen; i++ ) {
			buf[offset++] = payload[i] ^ maskKey[i % 4];
		}
	} else {
		buf.set( payload, offset );
	}

	return buf;
}

class WsEndpoint {
	#listenerFuncs = {
		close(){},
		message(){},
		pong(){},
	};

	#listenerNames = Object.keys( this.#listenerFuncs );
	#fds = undefined;
	#socket;
	#role;
	#dispatch = false;
	#closing = false;
	#closeTimeout;

	// parse state — was closure-local, now instance state so feed() can be called repeatedly
	#continueOpcode = 0;
	#chunks = [];
	#totalLength = 0;
	#buf = new Uint8Array( 0 );

	constructor( fds, socket, role, opts = {} ){
		this.#fds = fds;
		this.#socket = socket; // keeps socket alive while the WsEndpoint instance exists
		this.#role = role;
		this.#dispatch = Boolean( opts.dispatch );

		if( this.#dispatch ){
			// external feed mode: caller (e.g. wsClient.mjs) delivers bytes via feed()
			// after registering socket.setDataHandler — no self-registration here.
			return;
		}

		// legacy pipe/raw-fd mode: self-register, exactly as before
		let readBuf = new Uint8Array( 4096 );
		os.setReadHandler( this.#fds[ 0 ], () => {
			const n = os.read( this.#fds[ 0 ], readBuf.buffer, 0, readBuf.length );

			if( n <= 0 || ( n == 1 && readBuf[ 0 ] == 0 ) ){
				this.#handleClose( n );
				return;
			}
			this.feed( readBuf.slice( 0, n ) );
		} );
	};

	/* ---- dispatch-mode entry point: bytes (Uint8Array) or null (closed) ---- */
	feed( chunk ){
		if( chunk === null ){
			this.#handleClose( undefined );
			return;
		}
		this.#buf = concatUint8( this.#buf, chunk );
		this.#processBuffer();
	}

	#handleClose( n ){
		console.log( `wsEndpoint closing: ${ this.#closing }, n: ${ n }` );
		if( this.#closing ){
			closeTcp( this.#fds, this.#dispatch );
			this.#closing = false;
			if( this.#role == 'client' ){
				os.clearTimeout( this.#closeTimeout );
				this.#closeTimeout = undefined;
			} else {
				this.#listenerFuncs.close( { code: 1006, reason: 'Abnormal closure' } );
			}
		} else {
			closeTcp( this.#fds, this.#dispatch );
			this.#listenerFuncs.close( n == 1
				? { code: 1001, reason: 'TCP closed' } //qjs socket server behavior
				: { code: 1006, reason: 'Abnormal closure' }
			);
		}
	}

	#processBuffer(){
		let opcode, fin, ofs, len, masked;
		while( true ){
			let buf = this.#buf;
			if ( buf.length < 2 ) return;

			fin = ( buf[ 0 ] >> 7 ) && 0x1;
			opcode = buf[ 0 ] & 0xF;
			masked = Boolean( buf[1] & 0x80 );
			len = buf[1] & 0x7F;
			ofs = 2;
			if( len == 126 ){
				if( buf.length < ofs + 2 ) return;
				len = ( buf[ofs] << 8 ) | buf[ofs + 1];
				ofs += 2;
			} else if ( len === 127 ) {
				if( buf.length < ofs + 8 ) return;

				if( buf.slice( ofs, ofs + 4 ).find( e => e > 0 ) ){
					this.#protocolFail( 1009, 'Payload too large' );
					return;
				}

				len = (
					( buf[ofs + 4] << 24 ) |
					( buf[ofs + 5] << 16 ) |
					( buf[ofs + 6] << 8 ) |
					buf[ofs + 7]
				) >>> 0;

				ofs += 8;
			}

			let maskingKey = null;
			if ( masked ) {
				if ( buf.length < ofs + 4 ) return;
				maskingKey = buf.slice( ofs, ofs + 4 );
				ofs += 4;
			}

			if( len > MAX_PAYLOAD ){
				this.#protocolFail( 1009, 'Payload too large' );
				return;
			}

			if ( buf.length < ofs + len ) return;

			let payload = masked
				? buf.slice( ofs, ofs + len ).map( ( byte, i ) => byte ^ maskingKey[i % 4] )
				: buf.slice( ofs, ofs + len );

			if( opcode >= 0x8 ){
				if( opcode > 0xA || !fin || len > 125 ){
					// bad frame close
					return;
				}

				switch( opcode ){
					case 0x8:	//close
						if( this.#closing ){
							console.log( `${ this.#role } received ws close while closing` );
							if( this.#role == 'server' ){
								closeTcp( this.#fds, this.#dispatch );
								this.#closing = false;
							}
						} else {
							console.log( `${ this.#role } received ws close` );
							let code = new DataView( payload.buffer ).getUint16( 0 );
							let reason = dec.decode( payload.slice( 2 ) );
							this.#listenerFuncs.close( { code, reason } );
							const frame = closeFrame( code, reason );
							os.write( this.#fds[1], frame.buffer, 0, frame.byteLength );

							if( this.#role == 'client' ){
								this.#closing = true;
								this.#closeTimeout = os.setTimeout( () => {
									closeTcp( this.#fds, this.#dispatch );
									this.#listenerFuncs.close( { code: 1006, reason: 'Abnormal closure' } );
									this.#closing = false;
									this.#closeTimeout = undefined;
								}, 5000 );
							}else{
								console.log( `${ this.#role } closeTcp` );
								closeTcp( this.#fds, this.#dispatch );
							}
						}
						break;

					case 0x9: //ping
						{
							const frame = wsFrame( 0xA, buf.slice( ofs, ofs + len ), this.#role == 'client' ? 'mask' : undefined );
							os.write( this.#fds[1], frame.buffer, 0, frame.byteLength );
						}
						break;

					case 0xA: //pong
						this.#listenerFuncs.pong();
						break;
				}
				this.#buf = buf.slice( ofs + len );
				return;
			}

			if( ( this.#continueOpcode == 0 && opcode == 0 )
					|| ( this.#continueOpcode != 0 && opcode != 0 ) ){
				this.#continueOpcode = 0;
				this.#protocolFail( 1002, 'protocol error' );
				return;
			}

			switch( opcode ){
				case 0:
				case 1:
				case 2:
					if( opcode == 1 || this.#continueOpcode == 1 ){
						this.#chunks.push( String.fromCharCode.apply( null, payload ) );
					} else {
						this.#totalLength += len;
						this.#chunks.push( payload );
					}

					if( fin == 1 ){
						if( opcode == 1 || this.#continueOpcode == 1 ){
							const msg = this.#chunks.join( "" );
							this.#listenerFuncs.message( msg );
						} else {
							const result = new Uint8Array( this.#totalLength );
							let offset = 0;
							for ( const c of this.#chunks ) { result.set( c, offset ); offset += c.byteLength; }
							this.#listenerFuncs.message( result );
						}
						this.#totalLength = 0;
						this.#chunks = [];
						this.#continueOpcode = 0;
					}else{
						if( opcode != 0 ) this.#continueOpcode = opcode;
					}
					break;

				default:
					// bad opcode
			}
			this.#buf = buf.slice( ofs + len );
		}
	}

	#protocolFail( code, reason ){
		const frame = closeFrame( code, reason );
		os.write( this.#fds[ 1 ], frame.buffer, 0, frame.length );
		this.#closing = true;
		this.#closeTimeout = os.setTimeout( () => {
			closeTcp( this.#fds, this.#dispatch );
			this.#closing = false;
			this.#closeTimeout = undefined;
		}, 5000 );
	}

	on( event, func ){ if( this.#listenerNames.includes( event ) ) this.#listenerFuncs[ event] = func; };
	ping() {
		const frame = wsFrame( 0x9, new Uint8Array( 0 ), 'mask' );
		os.write( this.#fds[1], frame.buffer, 0, frame.length );
	}

	send( message ) {
		const payload = enc.encode( message );
		const frame = wsFrame( typeof message == 'string' ? 0x1 : 0x2, payload );
		os.write( this.#fds[1], frame.buffer, 0, frame.length );
	}

	close( code = 1000, reason = 'application close' ){
		this.#closing = true;
		const frame = closeFrame( code, reason );
		os.write( this.#fds[ 1 ], frame.buffer, 0, frame.length );
		this.#closeTimeout = os.setTimeout( () => {
			closeTcp( this.#fds, this.#dispatch );
			this.#closing = false;
			this.#closeTimeout = undefined;
		}, 5000 );
	};
}
