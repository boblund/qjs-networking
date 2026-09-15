import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFile } from 'fs/promises';
import { join, extname, normalize } from 'path';
import { URL } from 'url';
import jwt from 'jsonwebtoken';

// --- CLI args: node server.js <port> <directory> ---
const [ , , portArg, dirArg ] = process.argv;

if ( !portArg ) {
	console.error( 'Usage: node server.js <port> [<http_files_directory>]' );
	process.exit( 1 );
}

const PORT = parseInt( portArg, 10 );
const ROOT = dirArg ? normalize( dirArg ) : undefined;

const MIME_TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
};

// --- HTTP static file server ---
const server = createServer( !ROOT ? undefined : async ( req, res ) => {
	try {
		let urlPath = decodeURIComponent( req.url.split( '?' )[0] );
		if ( urlPath === '/' ) urlPath = '/index.html';

		// Resolve and confine to ROOT (basic path traversal guard)
		const filePath = normalize( join( ROOT, urlPath ) );
		/*if ( !filePath.startsWith( ROOT ) ) {
			res.writeHead( 403 );
			res.end( 'Forbidden' );
			return;
		}*/

		let data = await readFile( filePath );
		if( urlPath == '/index.html' && process.env?.LOCAL_BRUME )
			data = data.toString( 'utf8' ).replace(
				'window.LOCAL_BRUME = undefined', `window.LOCAL_BRUME = true`
			);
		const ext = extname( filePath ).toLowerCase();
		res.writeHead( 200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' } );
		res.end( data );
	} catch ( err ) {
		if ( err.code === 'ENOENT' ) {
			res.writeHead( 404 );
			res.end( 'Not found' );
		} else {
			console.error( err );
			res.writeHead( 500 );
			res.end( 'Server error' );
		}
	}
} );

// --- WebSocket server, sharing the same HTTP server/port ---
const wss = new WebSocketServer( { server } );

// Bidirectional lookup between connected sockets and their names
const wsToName = new Map(); // ws -> name
const nameToWs = new Map(); // name -> ws

wss.on( 'connection', ( ws, request ) => {
	const { searchParams } = new URL( request.url, `http://${ request.headers.host }` );
	const token = request.headers?.token || searchParams.get( 'token' );

	if ( !token ) {
		ws.close( 1008, 'Missing token' );
		return;
	}

	let name;
	try {
		// Local testing only: decoding, not verifying, the JWT signature.
		const payload = jwt.decode( token );
		name = payload?.[ 'custom:brume_name' ];
		if ( !name ) throw new Error( 'Token missing "name" claim' );
	} catch ( err ) {
		console.error( 'Invalid token:', err.message );
		ws.close( 1008, 'Invalid token' );
		return;
	}

	// If someone reconnects with the same name, boot the old socket
	const existing = nameToWs.get( name );
	if ( existing && existing !== ws ) {
		existing.close( 1000, 'Replaced by new connection' );
		wsToName.delete( existing );
	}

	wsToName.set( ws, name );
	nameToWs.set( name, ws );
	console.log( `WS client connected: ${ name }` );

	ws.on( 'error', console.error );

	ws.on( 'message', ( raw ) => {
		let msg;
		try {
			msg = JSON.parse( raw );
		} catch {
			console.error( 'Received non-JSON message:', raw.toString() );
			return;
		}

		const { to, data } = msg;
		const from = wsToName.get( ws );

		if ( !to ) {
			console.error( `Message from ${ from } missing "to" field` );
			return;
		}

		const targetWs = nameToWs.get( to );
		if ( !targetWs || targetWs.readyState !== targetWs.OPEN ) {
			console.error( `Target "${ to }" not connected (from ${ from })` );
			return;
		}

		targetWs.send( JSON.stringify( { from, ...data } ) );
	} );

	ws.on( 'close', () => {
		console.log( `WS client disconnected: ${ name }` );
		wsToName.delete( ws );
		// Only remove from nameToWs if this socket is still the one registered
		// (avoids clobbering a newer connection that reused the same name)
		if ( nameToWs.get( name ) === ws ) {
			nameToWs.delete( name );
		}
	} );
} );

server.on( 'error', ( err ) => {
	console.error( 'Could not start server:', err );
} );

server.listen( PORT, '127.0.0.1', () => {
	console.log( `Serving "${ ROOT }" at http://localhost:${ PORT }` );
	console.log( `WebSocket available at ws://localhost:${ PORT }` );
} );