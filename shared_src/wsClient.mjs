export { newWsClient };

import * as os from 'os';
import { Client } from 'socket.so';
import { WsEndpoint } from './wsEndpoint.mjs';
import { parseUrl } from './parseUrl.mjs';
import { TextEncoder, TextDecoder } from './EncodeDecode.mjs';

const enc = new TextEncoder();
const dec = new TextDecoder();

function findHeaderEnd( buf ){
	// scan raw bytes for \r\n\r\n — avoids decode/re-encode corrupting any
	// binary WS frame bytes that might follow in the same read
	for( let i = 0; i + 3 < buf.length; i++ ){
		if( buf[i] === 13 && buf[i+1] === 10 && buf[i+2] === 13 && buf[i+3] === 10 ){
			return i + 4;
		}
	}
	return -1;
}

function newWsClient( url, token = undefined ){
	const { protocol, addr, port, path } = parseUrl( url );
	const host = addr;
	const wsPath = path ?? '/';
	const req = [
		`GET ${ wsPath } HTTP/1.1`,
		`Host: ${ host }`,
		"Connection: Upgrade",
		"Upgrade: websocket",
		"Sec-WebSocket-Version: 13",
		"Sec-WebSocket-Key: IS0tZXhhbXBsZS5haS0tIQ==",
		"Origin: localhost",
		`token: ${ token }`,
		"",
		""
	].join( "\r\n" );

	const socket = new Client();
	const fds = socket.connect( {
		port: port ? port : ( protocol == 'wss' ? 443 : 80 ),
		host: addr,
		tls: protocol == 'wss' ? true : false
	} );
	if( fds === undefined ) throw { error: 'socket.connect failed' };

	const encoded = enc.encode( req );
	os.write( fds[1], encoded.buffer, 0, encoded.byteLength );

	// direct blocking read — real fd, kernel-level block, no event-loop dependency
	let acc = new Uint8Array( 0 );
	let headerEnd = -1;
	const readBuf = new Uint8Array( 4096 );
	while( headerEnd === -1 ){
		const n = os.read( fds[0], readBuf.buffer, 0, readBuf.length );
		if( n === 0 || ( n === 1 && readBuf[0] === 0 ) ){
			throw { error: 'connection closed during handshake' };
		}
		if( n > 0 ){
			const merged = new Uint8Array( acc.length + n );
			merged.set( acc, 0 );
			merged.set( readBuf.slice( 0, n ), acc.length );
			acc = merged;
			headerEnd = findHeaderEnd( acc );
		}
	}

	const statusLine = dec.decode( acc.slice( 0, acc.indexOf?.( 13 ) ?? headerEnd ) ).split( '\r\n' )[0];
	const [ , code, reason ] = statusLine.split( ' ' );
	if( code != '101' ){
		throw { code, reason, message: statusLine };
	}
	console.log( 'ws upgrade' );

	const wsEndpoint = new WsEndpoint( fds, socket, 'client', { dispatch: true } );

	// ordering matters: register the handler BEFORE startDispatch, so nothing
	// drained during the native-side mode flip is silently discarded
	socket.setDataHandler( ( bytes ) => wsEndpoint.feed( bytes ) );

	// any bytes that arrived after the header in the same read — real WS
	// frame data the server sent immediately following the 101 response
	if( headerEnd < acc.length ){
		wsEndpoint.feed( acc.slice( headerEnd ) );
	}

	socket.startDispatch();

	return wsEndpoint;
};