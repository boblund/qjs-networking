import * as os from 'os';
import { initHttpResponse } from './parseHttpResponse.mjs';
import { TextEncoder, TextDecoder } from '../EncodeDecode.mjs';

const enc = new TextEncoder;
const dec = new TextDecoder;

export function httpRequest( fds, req ){
	return new Promise( ( res, rej ) => {
		let readBuf = new Uint8Array( 4096 );
		let noContentLength;
		let status;

		let parseHttpResponse = initHttpResponse( ( resp ) => {
			noContentLength = false;
			if( resp?.error ){
				console.log( 'HTTP response error:', resp.error );
			} else {
				status = Number( resp.headers.match( /^HTTP.*?\s+(\d+).*/ )[ 1 ] );
				status == 200 ? res( resp ) : rej( { status, resp  } );
				os.setReadHandler( fds[ 0 ], null );
				os.close( fds[ 0 ] ); os.close( fds[ 1 ] );
				fds[ 0 ] = fds[ 1 ] = undefined;
			}
		}, () => {
			noContentLength = true;
		} );

		os.setReadHandler( fds[ 0 ], () => {
			const n = os.read( fds[ 0 ], readBuf.buffer, 0, readBuf.length );
			if( n < 0 || ( n === 1 && readBuf[0] === 0 ) || n === 0 && !noContentLength  ){
				rej( n < 0 ? { error: `Connection error: ${ n }` } : { closed: `Connection closed` } );
				os.setReadHandler( fds[ 0 ], null );
				os.close( fds[ 0 ] ); os.close( fds[ 1 ] );
				fds[ 0 ] = fds[ 1 ] = undefined;
			} else {
				parseHttpResponse( readBuf.slice( 0, n ) );
			}
		} );

		let aBuf = enc.encode( req ).buffer;
		os.write( fds[ 1 ], aBuf, 0, aBuf.byteLength );
	} );
}