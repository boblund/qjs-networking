/**
 * cognito module.
 * @module cognito
 * @see module:cognito
 */

import * as os from 'os';
import { Client } from 'socket.so';
import { httpRequest, httpRequestSync } from './httpRequest.mjs';

const REGION = 'us-east-1';
const CLIENT_ID = '6dspdoqn9q00f0v42c12qvkh5l';
const HOST = `cognito-idp.${ REGION }.amazonaws.com`;

let client;

/**
 * Returns an AWS Cognito Idtoken given a refresh token using HTTPS
 *
 * @param refreshToken user's Cognito refresh token
 * @return new user's Cognito IdToken
 * @throws Authentication failed error
 */

export async function refreshIdToken( refreshToken ) {
	const ipService = 'InitiateAuth';
	const ipServicePayload = JSON.stringify( {
		AuthFlow: 'REFRESH_TOKEN_AUTH',
		ClientId: CLIENT_ID,
		AuthParameters: { REFRESH_TOKEN: refreshToken }
	} );

	const req = [
		`POST / HTTP/1.1`,
		`Host: ${ HOST }`,
		`Content-Type: application/x-amz-json-1.1`,
		`X-Amz-Target: AWSCognitoIdentityProviderService.${ ipService }`,
		`Content-Length: ${ ipServicePayload.length }`,
		`Connection: close`,
		``,
		ipServicePayload
	].join( '\r\n' );

	client = new Client();
	let fds = client.connect( { port: 443, host: HOST, tls: true } );
	let resp;

	try{
		resp = await httpRequest( fds, req );
		return JSON.parse( resp.body ).AuthenticationResult.IdToken;
	} catch( e ){
		throw e;
	}
}

/**
 * Returns a user's AWS Cognito Idtoken given their username/password using HTTPS
 *
 * @param username user's Cognito username
 * @param password user's Cognito password
 *
 * @return New user's Cognito IdToken
 * @return Challenge name if new password required
 * @throws Authentication failed error
 */

export function login( username, password ) {
	const payload = JSON.stringify( {
		AuthFlow: 'USER_PASSWORD_AUTH',
		ClientId: CLIENT_ID,
		AuthParameters: { USERNAME: username, PASSWORD: password }
	} );

	const req = [
		`POST / HTTP/1.1`,
		`Host: ${ HOST }`,
		`Content-Type: application/x-amz-json-1.1`,
		`X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth`,
		`Content-Length: ${ payload.length }`,
		`Connection: close`,
		``,
		payload
	].join( '\r\n' );

	const client = new Client();
	const fds = client.connect( { port: 443, host: HOST, tls: true } );
	const resp = httpRequestSync( fds, req ); //await httpRequest( fds, req );
	const body = JSON.parse( resp.body );
	//console.log( `cognito.mjs ${ JSON.stringify( body, null, 2 ) }` );

	if ( body.ChallengeName ) {
		// e.g. NEW_PASSWORD_REQUIRED — mirrors BrumeLoginCe's existing
		// special-case handling, just surfaced as structured data instead
		// of a thrown string, so the caller (native w.bind) can decide
		// what to do with it rather than alert()-ing directly
		return { challenge: body.ChallengeName, session: body.Session };
	}
	if ( !body.AuthenticationResult ) {
		throw { code: body.__type, message: body.message };
	}

	return { IdToken: body.AuthenticationResult.IdToken };
}
