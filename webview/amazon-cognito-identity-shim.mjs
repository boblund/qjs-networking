// qjs-webview/cognito-shim.mjs
//
// Build-time replacement for 'amazon-cognito-identity-js', wired in via
// webpack's resolve.alias in qjs-webview/webpack.config.js ONLY. Real
// browser builds never see this file — their webpack config resolves
// 'amazon-cognito-identity-js' to the genuine npm package.
//
// Mirrors just enough of the real library's public shape (the classes
// and methods brume-ce/index.mjs's #userPassAuth actually calls) so that
// index.mjs needs zero changes and zero awareness that it's running
// against a native bridge instead of the real SRP-based library.
//
// Underlying auth is delegated to window.brumeLogin(username, password),
// provided natively by webviewApp.mjs's `w.bind('brumeLogin', ...)`.

export class AuthenticationDetails {
	constructor( { Username, Password } = {} ) {
		this.username = Username;
		this.password = Password;
	}
}

export class CognitoUserPool {
	// Real library validates/stores UserPoolId+ClientId here; native auth
	// doesn't need them (cognito.mjs's login() already hardcodes them),
	// so this is intentionally a no-op — kept only so `new CognitoUserPool(...)`
	// doesn't throw.
	constructor( _opts ) {}
}

export class CognitoUser {
	constructor( { Username } = {} ) {
		this.username = Username;
	}

	// Matches the real library's signature exactly:
	//   cognitoUser.authenticateUser(authenticationDetails, { onSuccess, onFailure })
	async authenticateUser( authenticationDetails, { onSuccess, onFailure } ) {
		let r;
		try {
			r = await window.brumeLogin( this.username, authenticationDetails.password );
		} catch ( e ) {
			onFailure( e?.message ?? e );
			return;
		}

		if ( r.challenge ) {
			onFailure( r.challenge );
			return;
		}

		onSuccess( {
			getIdToken: () => ( {
				getJwtToken: () => r.IdToken
			} )
		} );
	}

	// Real library's getUserAttributes(callback) — index.mjs's onSuccess
	// handler calls this but ignores the result entirely
	// (`cognitoUser.getUserAttributes((e, r) => { res({ IdToken: ... }); })`),
	// so a no-op callback invocation satisfies the call without needing
	// real attribute data.
	getUserAttributes( callback ) {
		callback( null, [] );
	}
}
