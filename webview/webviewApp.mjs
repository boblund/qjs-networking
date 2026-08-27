// webviewApp.mjs
import * as std from 'std';
import * as os from 'os';
import { Webview } from './webview.so';
import { QjsPeer } from './qjsPeer.mjs';
import { newWsClient } from './wsClient.mjs';
import { login } from './cognito.mjs';

const local_brume = std.getenv( 'LOCAL_BRUME' );
if( scriptArgs.length != 2 && !local_brume ) {
	console.log( `Usage: [LOCAL_BRUME=IP_ADDR:PORT] ${ scriptArgs[ 0 ] } [html_file]` );
	std.exit( 1 );
}

const wsUrl = local_brume ? `ws://${ local_brume }` : 'wss://brume.occams.solutions/Prod';
const navPath = scriptArgs.length == 2 ? `file://${ os.realpath( scriptArgs[1] )[0] }` : `http://${ local_brume }`;
console.log( `html path: ${ navPath }` );
console.log( `ws path: ${ wsUrl }` );

const w = new Webview( 1 );
w.setTitle( 'P2P App' );
w.setSize( 900, 700 );

w.bind( 'webview', () => true );
w.bind( 'localBrume', () => std.getenv( 'LOCAL_BRUME' ) );


/* ---- native -> browser: unsolicited events ---- */
function pushToUI( type, detail ) {
	w.eval( `window.dispatchEvent(new CustomEvent('brume', { detail: ${ JSON.stringify( { type, detail } ) } }))` );
}

/* ---- minimal base64/JWT decode, no atob dependency ---- */
function fromBase64( b64 ) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	b64 = b64.replace( /-/g, '+' ).replace( /_/g, '/' ).replace( /=+$/, '' );
	const bytes = [];
	let buffer = 0, bits = 0;
	for ( const c of b64 ) {
		const idx = chars.indexOf( c );
		if ( idx === -1 ) continue;
		buffer = ( buffer << 6 ) | idx;
		bits += 6;
		if ( bits >= 8 ) { bits -= 8; bytes.push( ( buffer >> bits ) & 0xFF ); }
	}
	return bytes;
}
function usernameFromToken( token ) {
	return JSON.parse( String.fromCharCode.apply( null, fromBase64( token.split( '.' )[1] ) ) )['custom:brume_name'];
}

/* ---- state ---- */
let wsc, myName, peer;
let pendingOffer;   // { from, msg } awaiting browser accept/decline

function makePeer( { initiator = false, label = 'data', peerName } ) {
	const p = new QjsPeer( { initiator, label, dispatch: true } );
	p.createQueues( [ 'default' ] );
	p.priorityChannel.addQueue( 'default' );
	p.typeToQueue = () => 'default';
	p.peerName = peerName;
	p.myName = myName;

	p.on( 'sdp', ( sdp ) => {
		wsc.send( JSON.stringify( {
			action: 'send',
			to: p.peerName,
			data: { type: p.initiator ? 'offer' : 'answer', sdp }
		} ) );
	} );

	p.on( 'connect', () => {
		pushToUI( 'connect', { peerName: p.peerName } );
		p.send( { type: 'chat', data: `Hi ${ peer.peerName }` } );
	} );

	p.on( 'data', ( msg ) => { pushToUI( 'data', { peerName: p.peerName, msg } ); } );
	p.on( 'disconnect', () => {
		pushToUI( 'disconnect', { peerName: p.peerName } );
		p.close();
		if ( peer === p ) peer = undefined;
	} );
	return p;
}

/* ---- browser -> native: calls exposed via bind ---- */

w.bind( 'brumeLogin', ( username, password ) => {
	try {
		const r = login( username, password );
		return r;
	} catch ( e ) {
		return { error: e.message ?? String( e ) };
	}
} );

w.bind( 'brumeStart', ( token ) => {
	myName = usernameFromToken( token );
	wsc = newWsClient( wsUrl, token );

	wsc.on( 'close', ( reason ) => {
		console.log( `wsc close: ${ JSON.stringify( reason ) }` );
		wsc = undefined;
		pushToUI( 'wsClose', {} );
	} );

	wsc.on( 'message', ( message ) => {
		const msg = JSON.parse( message );
		const msgType = msg.type ? msg.type : msg?.data?.type;
		switch ( msgType ) {
			case 'answer':
				peer?.signal( msg );
				break;

			case 'offer':
				if ( peer ) break;   // already in a call — ignore, matches p2pClient's single-peer assumption
				pendingOffer = { from: msg.from, msg };
				pushToUI( 'offer', { from: msg.from } );
				break;

			case 'peerError': {
				const { type, code, peerUsername } = msg.data;
				console.log( type, code, peerUsername );
				pushToUI( 'peerError', { type, code, peerUsername } );
				break;
			}

			default:
				console.log( `unknown ws message: ${ message }` );
		}
	} );
	console.log( `webviewApp.mjs brumeStart myname: ${ myName }` );
	return myName;
} );

w.bind( 'brumeCall', async ( peerName ) => {
	if ( peer ) return false;
	peer = makePeer( { initiator: true, label: 'data', peerName } );
	return true;
} );

w.bind( 'brumeAnswer', async ( accept ) => {
	const offer = pendingOffer;
	pendingOffer = undefined;
	if ( !accept || !offer ) return false;
	peer = makePeer( { label: 'data', peerName: offer.from } );
	peer.signal( offer.msg );
	return true;
} );

w.bind( 'brumeSend', async ( text ) => {
	peer?.send( { type: 'chat', data: text } );
} );

w.bind( 'brumeHangup', async () => {
	if( peer ){ peer.close(); peer = undefined; }
} );

w.navigate( navPath );
w.run();

if( peer ){
	peer.close();
	peer = undefined;
	console.log( 'peer closed' );
}

if ( wsc ) {
	wsc.close();
	wsc.waitForClose();
	console.log( 'wsc thread exited' );
}
w.destroy();
