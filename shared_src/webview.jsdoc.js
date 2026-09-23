/**
 * @module Webview
 * @description
 * JSDoc-only declaration for QuickJS webview_c_module/webview.c
 * Static library created in lib/libqjswebview.a
 */

/**
 * JS Class exported by a QuickJS C module representing a webview based on {@link https://github.com/webview/webview}.
 *
 * JS writes text/binary data using sendText/sendBuf methods.
 * Data received on the datachannel is sent back to JS using <b>fd mode</b> or <b>dispatch mode</b>.
 * See 'qjs-networking/README.md' 'C module callback modes' for more details.
 * The dispatch argument in the {@link module:dc.PeerConnection|PeerConnection constructor} specifies which mode
 * to use.
 * @class
 */

export class Webview{
	/**
	 * Creates a new webview instance.
	 *
	 * @param {number} debug Enable developer tools if supported by the backend.
	 * @return {Webview} A Webview instance.
	 */
	constructor( debug ){};

	/**
	 * Destroys a webview instance and closes the native window.
	 *
	 * @return {void}
	 */
	destroy(){};

	/**
	 * Runs the main loop until it's terminated.
	 *
	 * @return {void}
	 */
	run(){};

	/**
	 * Stops the main loop. It is safe to call this function from another
	 * background thread.
	 *
	 * @return {void}
	 */
	terminate(){};

	/**
	 * Updates the title of the native window.
	 *
	 * @param {string} title The new title.
	 * @return {void}
	 */
	setTitle( title ){};

	/**
	 * Updates the size of the native window.
	 *
	 * Remarks:
	 * - Subsequent calls to this function may behave inconsistently across
	 *   different versions of GTK and windowing systems (X11/Wayland).
	 * - Using WEBVIEW_HINT_MAX for setting the maximum window size is not
	 *   supported with GTK 4 because X11-specific functions such as
	 *   gtk_window_set_geometry_hints were removed. This option has no effect
	 *   when using GTK 4.
	 *
	 * @param {number} width New width.
	 * @param {number} height New height.
	 * @param {number} hints Size hints.
	 * @return {void}
	 */
	setSize( width, height, hints){};

	/**
	 * Navigates webview to the given URL. URL may be a properly encoded data URI.
	 *
	 * Example:
	 * @code{.c}
	 * webview_navigate(w, "https://github.com/webview/webview");
	 * webview_navigate(w, "data:text/html,%3Ch1%3EHello%3C%2Fh1%3E");
	 * webview_navigate(w, "data:text/html;base64,PGgxPkhlbGxvPC9oMT4=");
	 * webview_navigate(w, "file:///path_to_file");
	 * @endcode
	 *
	 * @param {string} url URL.
	 * @return {void}
	 */
	navigate( url ){};

	/**
	 * Load HTML content into the webview.
	 *
	 * Example:
	 * @code{.c}
	 * webview_set_html(w, "<h1>Hello</h1>");
	 * @endcode
	 *
	 * @param {string} html HTML content.
	 * @return {void}
	 */
	setHtml( html ){};

	/**
	 * Injects JavaScript code to be executed immediately upon loading a page.
	 * The code will be executed before @c window.onload.
	 * NOT YET IMPLEMENTED
	 *
	 * @param {string} js JS content.
	 * @return {void}
	 */
	init( js ){};

	/**
	 * Evaluates arbitrary JavaScript code.
	 *
	 * Use bindings if you need to communicate the result of the evaluation.

	 * @param {string }s JS content.
	 * @return {void}
	 */
	eval( js ){};

	/**
	 * Binds a function pointer to a new global JavaScript function.
	 *
	 * Internally, JS glue code is injected to create the JS function by the
	 * given name. The callback function is passed a request identifier,
	 * a request string and a user-provided argument. The request string is
	 * a JSON array of the arguments passed to the JS function.
	 *
	 * @param {string} name Name of the JS function.
	 * @param {function} fn Callback function.
	 * @return {void}
	 */
	bind( name, fn ){};

	/**
	 * Removes a binding created with webview_bind().
	 *
	 * @param {string} name Name of the binding.
	 * @return {void}
	 */
	unbind( name ){};

	/**
	 * Responds to a binding call from the JS side.
	 *
	 * This function is safe to call from another thread.
	 *
	 * @param id The identifier of the binding call. Pass along the value received
	 *           in the binding handler (see webview_bind()).
	 * @param status A status of zero tells the JS side that the binding call was
	 *               successful; any other value indicates an error.
	 * @param result The result of the binding call to be returned to the JS side.
	 *               This must either be a valid JSON value or an empty string for
	 *               the primitive JS value @c undefined.
	 * NOT IMPLEMENTED
	 */
	return( id, tatus, result ){};
}

/**
 * The standard way to emit a DOM event into the JavaScript environment of a WebView.
 * Use it for native → web notifications after injecting/evaluating JavaScript in the WebView.
 * Listen with window.addEventListener(...) in the page. On the native side (JS webview app):
 * <pre>
 * w.eval( `window.dispatchEvent(
 *   new CustomEvent( 'brume', {
 *     detail: ${ JSON.stringify( { 'connect', { peerName: p.peerName } } ) }
 * } ) )` );
 * </pre>
 * </br>
 * In the browser side JS
 * <pre>
 * window.addEventListener( 'brume', ( e ) => {
 *   const { type, detail } = e.detail;
 *     switch ( type ) {
 *       case 'connect':
 *          &#8942;
 * </pre>
 */
function dispatchEvent( name, js_func ){};

