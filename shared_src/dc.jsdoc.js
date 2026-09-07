/**
 * @module datachannel
 * @description
 * JSDoc-only declaration for QuickJS datachan_c_module/libdatachan.c
 * Static library created in lib/libqjsdatachannel.a
 */

/**
 * JS Class exported by a QuickJS C module representing a webrtc datachannel based on {@link https://github.com/paullouisageneau/libdatachannel}.
 * JS writes text/binary data using sendText/sendBuf methods.
 * Data received on the datachannel is sent back to JS using <b>fd mode</b> or <b>dispatch mode</b>.
 * See 'qjs-networking/README.md' 'C module callback modes' for more details.
 * The dispatch argument in the {@link module:datachannel.DataChannel|DataChannel constructor} specifies which mode
 * to use.
 * @class
 */

export class DataChannel{
	/**
	 * Create a new datachannel
	 * @param {Object} options
	 * @param {string} options.stun_host STUN server
	 * @param {number} options.stun_port STUN server port
	 * @param {boolean} options.initiator Is datachannel initiator
	 * @param {string} options.lable Datachannel label
	 * @param {boolen} options.dispath Whether to use dispatch mode
	 */
	constructor( { stun_host, stun_port, initiator, label, dispatch } ){}

	/**
	 * Close the datachannel
	 * @return {void}
	 */
	close(){}

	/**
	 * Set the offer SDP
	 * @param {string} sdp The remote offer SDP
	 * @return {void}
	 */
	connect( sdp ){}

	/**
	 * Get the data channel buffered data amount
	 * @return {number} Number of buffered bytes
	 */
	getBufferedAmount(){}

	/**
	 * Set the data channel event handler
	 * @param {function} handler The function to handle incoming data channel messages
	 * @return {void}
	 */
	setEventHandler( handler ){}

	/**
	 * Set the the answer SDP
	 * @param {string} sdp The remote answer SDP
	 * @return {void}
	 */
	setRemoteDescription(){}

	/**
	 * Send a Uint8Array data on the data channel
	 * @param {Uint8Array} uint8 The binary message
	 * @return {void}
	 */
	sendBuf( uint8_data ){}

	/**
	 * Send string data on the data channel
	 * @param {string} string_data The string message
	 * @return {void}
	 */
	sendText( string_data ){}

}

/**
 *  DataChannel static message type formats
 *
 * <table class="params">
 *   <thead>
 *     <tr><th>Name</th><th>Description</th><th>Payload</th></tr>
 *   </thead>
 *   <tbody>
 *     <tr> <td>MSG_SDP</td> <td>SDP</td> <td>SDP text</td> </tr>
 *     <tr> <td>MSG_DATA</td> <td>Connection data</td>  <td><pre>
           Bytes
------------------------------
 7              |6 6 4 3 2 1 0
------------------------------
 Text(1)/Binary | Type length
 Type string
     &#8942;
 Payload
     &#8942;
</pre></td> </tr>
 *     <tr> <td>MSG_CONNECTED </td> <td>ICE connectivity established.</td> <td>none</td> </tr>
 *     <tr> <td>MSG_DISCONNECTED</td> <td>ICE connectivity lost</td> <td>none</td> </tr>
 *     <tr> <td>MSG_DC_OPEN</td> <td>Connection open</td> <td>none</td> </tr>
 *     <tr> <td>MSG_DC_CLOSE</td> <td>Connection closed</td> <td>none</td> </tr>
 *     <tr> <td>MSG_BUFFERED_LOW</td> <td>Buffered amount dropped below the low-water mark</td><td>none</td></tr>
 *   </tbody>
 * </table>
 *
 * @typedef {Object} MessageType
 * @memberof module:datachannel.DataChannel
 */
