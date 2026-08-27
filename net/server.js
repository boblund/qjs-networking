import * as os from 'os';
import * as std from 'std';
import { Server } from 'socket.so';
import { TextEncoder } from '../EncodeDecode.mjs';

const enc = new TextEncoder;

if( scriptArgs.length > 3 ){
	console.log( `Usage: ${ scriptArgs[ 0 ] } port [tls]` );
	std.exit( 1 );
}
const [ port, tls = false ] = scriptArgs.slice( 1 );
const server = new Server();
const { stop, pipe_fd } = tls
	? server.listen( { port, key: '../key.pem', cert: '../cert.pem' } )
	: server.listen( { port } );
if( !pipe_fd ) std.exit( 1 );
os.signal( os.SIGUSR1, () => {
	//stop();
	console.log( '\nserver stopped' );
	std.exit( 0 );
} );
console.log( `Socket server started on port: ${ port }` );
const fdBuff = new Int32Array( 2 );
const READBUF_CHUNK_SIZE = 4096;

let response =
	"HTTP/1.1 200 OK\r\n" +
	"Content-Type: text/plain\r\n" +
	"Content-Length: 12\r\n" +
	"Connection: Keep-Alive\r\n" +
	"\r\n" +
	"Hello, World";

function clientServer( client_r_fd, client_w_fd ){
	const readBuf = new Uint8Array( READBUF_CHUNK_SIZE );
	let n;
	while( true ){
		if ( ( n = os.read( client_r_fd, readBuf.buffer, 0, readBuf.length ) )  > 0 ) {
			let ab = enc.encode( response ).buffer;
			os.write( client_w_fd, ab, 0, ab.byteLength );
			readBuf.fill( 0 );
		} else {
			console.log( `client disconnected on fd ${ client_r_fd }` );
			os.setReadHandler( client_r_fd, null );
			os.close( client_r_fd );
			os.close( client_w_fd );
			break;
		}
	}
};

// Read pipe from C side to get client attaches
os.setReadHandler( pipe_fd, () => {
	let n;
	if( ( n = os.read( pipe_fd, fdBuff.buffer, 0, fdBuff.length * 4 ) ) > 0 ){
		const [ ssl_r_fd, ssl_w_fd ] = Array.from( fdBuff );
		os.setReadHandler( ssl_r_fd, () => clientServer( ssl_r_fd, ssl_w_fd ) );
	} else {
		console.log( 'server stopping' );
		os.close( pipe_fd );
		stop();
	}
} );
