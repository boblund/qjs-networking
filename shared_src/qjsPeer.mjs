/**
 * qjsPeer module.
 * @module qjsPeer
 * @see module:qjsPeer
 */

import * as os from 'os';
import { TextEncoder, TextDecoder } from './EncodeDecode.mjs';
import { DataChannel } from './dc.so';
import { PriorityChannel } from './priorityChannel.mjs';

const enc = new TextEncoder;

function encodeMsg( { type, data = {} } ){
	const text = data instanceof Uint8Array ? 0 : 1;
	const _data = text == 1 ? enc.encode( JSON.stringify( data ) ) : data;
	const a = new Uint8Array( 1 + type.length + _data.length );
	a[ 0 ] = ( text << 7 ) | ( type.length & 0x7F );
	a.set( enc.encode( type ), 1 );
	a.set( _data, 1 + type.length );
	return a;
}

/**
 * Class representing a webrtc Peer.
 */

export class QjsPeer{
	priorityChannel;
	typeToQueue = () => { throw( 'QjsPeer.typeToQueue not set' ); };
	initiator;
	agent;

	listeners = {
		sdp(){},
		connect(){},
		data(){},
		disconnect(){},
		signal(){}
	};

	listenerNames = Object.keys( this.listeners );

	/**
	 * Create a Peer
	 * @param {Object} args
	 * @param {boolean} [args.initiator=false] if true then initiating the connection
	 * @param {string} [args.label='not_set'] label for data channel
	 * @param {boolean} [args.dispatch=false] if true use dispatch
	 */

	constructor( { initiator, label, dispatch } = { initiator: false, label: 'not_set', dispatch: false } ){
		this.agent = new DataChannel( {
			stun_host: "stun.l.google.com",
			stun_port: 19302,
			initiator,
			label,
			dispatch,
			onEvent: ( type, bytes ) => handleEvent( type, bytes )   // register before any native work starts
		} );

		this.initiator = initiator;
		//console.log( `this.agent.getBufferedAmount: ${ this.agent?.getBufferedAmount }` );

		this.agent.dcOpen = () => { this.listeners.connect(); };
		dcMsgHandler( this );
	}

	/**
	 * Close datachannel
	 * @returns {undefined}
	 */
	close(){
		this.agent.close();
	}

	/**
	 * Creat queues
	 * @param {Array} queuesOrder string names of queues in descending priority order
	 * @returns {undefined}
	 */

	createQueues( queuesOrder ){
		this.priorityChannel = new PriorityChannel( {
			sendFn: ( item ) => { this.agent.sendBuf( encodeMsg( item ).buffer ); },
			getHwFn: () => { return this.agent.getBufferedAmount(); },
			queuesOrder
		} );
	}

	/**
	 * Registers event handler
	 * @param {string} event name
	 * @param {function} handler function
	 * @returns {undefined}
	 */
	on( event, handler ){
		if( this.listenerNames.includes( event ) ) this.listeners[ event ] = handler;
	}

	/**
	 * Send message
	 * @param {string} type message type
	 * @param {string | Uint8Array } data to send
	 * @returns {undefined}
	 */

	send( { type, data } ){
		this.priorityChannel.send( this.typeToQueue( type ), { type, data } );
		this.priorityChannel.pump;
	};

	/**
	 * Signal local peer with msg
	 * @param {string} msg sdp
	 * @returns {undefined}
	 */

	signal( msg ){
		switch( msg.type ){
			case 'offer':
				this.agent.connect( msg.sdp );
				break;

			case 'answer':
				this.agent.setRemoteDescription( msg.sdp );
				break;

			default:
		}
	};

	/**
	 * name of peer
	 * @type {string}
	 */
	peerName = '';

	/**
	 * local peer name
	 * @type {string}
	 */
	myName = '';
}

// -----------------------------------------------------------------------------
// dcMsgHandler
// Handle messages from libdatachannel. These are about the state of the datachannel
// and data received over the channel frome the peer
// ---------------------------------------------------------------------------

let handleEvent;
function dcMsgHandler( qjspeer ) {
	const dec = new TextDecoder();

	handleEvent = ( type, bytes ) => {
		console.log( `qjsPeer.mjs hanleEvent type: ${ type }` );
		switch ( type ) {
			case DataChannel.MSG_SDP:
				qjspeer.listeners.sdp( dec.decode( bytes ) );
				break;

			case DataChannel.MSG_DC_OPEN:
				qjspeer.agent.dcOpen();
				break;

			case DataChannel.MSG_DC_CLOSE:
				console.log( `datachannel closed: ${ dec.decode( bytes ) }` );
				break;

			case DataChannel.MSG_CONNECTED:
				console.log( 'ICE connected' );
				break;

			case DataChannel.MSG_DISCONNECTED:
				if( 'fd' in qjspeer.agent ) os.setReadHandler( qjspeer.agent.fd, null );
				qjspeer.listeners.disconnect();
				break;

			case DataChannel.MSG_DATA:
				const [ text, typeLength ] = [ bytes[0] >> 7, bytes[0] & 0x7F ];
				const msgType = dec.decode( bytes.slice( 1, 1 + typeLength ) );
				const data = text == 1
					? JSON.parse( dec.decode( bytes.slice( 1 + typeLength ) ) )
					: bytes.slice( 1 + typeLength );
				qjspeer.listeners.data( { type: msgType, data } );
				break;

			case DataChannel.MSG_BUFFERED_LOW:
				qjspeer.pump();
				break;

			default:
				break;
		}
	};

	if ( 'fd' in qjspeer.agent ) {
		os.setReadHandler( qjspeer.agent.fd, () => {
			const msg = readMsg( qjspeer.agent.fd );
			handleEvent( msg.type, msg.data );
		} );
	} else {
		qjspeer.agent.setEventHandler( handleEvent );   // (type, bytes) => ...
	}


}

// ---------------------------------------------------------------------------
// readExact, readMsg
// Helper for dcMsgHandler
// ---------------------------------------------------------------------------

function readExact( fd, buf, length ) {
	let total = 0;
	while ( total < length ) {
		const n = os.read( fd, buf, total, length - total );
		if ( n <= 0 ) throw ( { code: 'eof or read error' } );
		total += n;
	}
	return total;
}

function readMsg( fd ) {
	const headerBuf = new Uint8Array( 5 );
	readExact( fd, headerBuf.buffer, 5 );
	const type = headerBuf[0];
	const payloadLength = new DataView( headerBuf.buffer ).getInt32( 1, false );

	switch ( type ) {
		case DataChannel.MSG_SDP:
		case DataChannel.MSG_DATA:
		case DataChannel.MSG_DC_OPEN:
		case DataChannel.MSG_DC_CLOSE: {
			const payloadBuf = new Uint8Array( payloadLength );
			if ( payloadLength > 0 ) readExact( fd, payloadBuf.buffer, payloadLength );
			return { type, data: payloadBuf, length: payloadLength };
		}
		default:
			return { type };
	}
}


