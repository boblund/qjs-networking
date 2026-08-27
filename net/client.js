import * as os from 'os';
import * as std from 'std';
import { Client, dispatchInit, dispatchDrain } from 'socket.so';
import { TextEncoder } from '../EncodeDecode.mjs';

const enc = new TextEncoder;

const wakeFd = dispatchInit();
const wakeScratch = new Uint8Array( 64 );
os.setReadHandler( wakeFd, () => {
	os.read( wakeFd, wakeScratch.buffer, 0, wakeScratch.length );
	dispatchDrain();
} );

function clientApp( bytes ){
	if ( bytes === null ) {
		console.log( 'connection closed' );
		std.exit( 0 );
	}
	console.log( String.fromCharCode( ...new Uint8Array( bytes ) ) );
}

const CHUNK_SIZE = 4096;
if( scriptArgs.length < 2 || scriptArgs.length > 4 ){
	console.log( `Usage: ${ scriptArgs[ 0 ] } port [host [tls]]` );
	std.exit( 1 );
}
let [ port, host, tls ] = scriptArgs.slice( 1 );
tls = tls ? true : undefined;
const client = new Client();
let fds = client.connect( { host, port, tls } );
client.setDataHandler( ( bytes ) => clientApp( bytes ) );
client.startDispatch();
let ab = enc.encode( `client sending data` ).buffer;
const n = os.write( fds[ 1 ], ab, 0, ab.byteLength );
