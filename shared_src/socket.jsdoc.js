/**
 * @module socket
 * @description
 * JSDoc-only declaration file for QuickJS socket_c_module/socket.c.<br>
 * Static library created in lib/libqjssocket.a.<br>
 * Shared library created in socket_c_module/socket.so
 */

/**
 * Class representing client end of TCP or TLS socket
 * Two mutually exclusive I/O modes are available :</br></br>
 * <b>fd mode (default)</b>: read/write the file descriptors returned by {@link module:socket.Client#connect}</br></br>
 * <b>dispatch mode</b>: call {@link module:socket.Client#startDispatch startDispatch()} once, then receive
 *   all data through the callback set with {@link module:socket.Client#setDataHandler}.
 * @class
 *
 */

export class Client{
	constructor(){}

	/**
	 * open TCP connection
	 * @param {Object} options client options
	 * @param {string} [options.host='localhost'] server address
	 * @param {number} options.port server port
	 * @param {boolean} [options.tls=false] use tls
	 * @returns {Array.<number>|undefined} [readFd, writeFd] on success,
 	 *  'undefined' if the connection/handshake failed (see stderr for details).
	 */

	connect( options ){};

	/**
	 * Shutdown the socket. Close file descriptors.
	 * @returns {void}
	 */
	end(){}

	/**
	 * Set the handler to call when data arrives on the socket
	 * @param {function} handler callback for received data
	 * @returns {void}
	 */

	setDataHandler( handler ){}

	/**
	 * Switch this connection into dispatch mode, incoming bytes are
	 * delivered to the handler set with {@link module:socket.Client#setDataHandler setDataHandler()} instead
	 * of being read manually from the fd. Called once, after connect() and setDataHandler().
	 * @returns {void}
	 */
	startDispatch(){}

	/**
	 * Block the calling thread until the connection's background I/O thread
	 * has exited (i.e. the socket is fully closed on both plain-TCP dispatch
	 * and TLS paths). Because this blocks synchronously, avoid calling it on
	 * a thread that also needs to pump the dispatch queue, or it will deadlock.
	 * @returns {void}
	 */

	waitForClose(){}
}

/**
 * A TCP/TLS listening socket that accepts connections on a background
 * thread and hands each one off through `pipe_fd`.
 * @class
 */
export class Server{
	constructor(){}

	/**
	 * Bind and start listening. Spawns a detached accept-loop thread; new
	 * connections are pushed as fd pairs onto pipe_fd).
	 * @param {Object} options
	 * @param {number} options.port listening port
	 * @param {string} [options.key] private key if TLS
	 * @param {string} [options.cert] certificate if TLS
	 * @returns {Object} {pipe_fd: number} pipd_fd: file descriptor
	 */
	listen( { port, key, cert } ){}

	/**
	 * End connection to the client by doing shutdown of the read side of the socket
	 * @param {number} fd the socket read fd
	 * @returns {void}
	 */
	end( fd ){}
}


/**
 * Set up the pipe-based fallback used to marshal background-thread events
 * (e.g. dispatch-mode data callbacks) onto the main JS thread's job queue.
 * Call once during startup, before any {@link Client#startDispatch} usage.
 * @returns {number} A readable fd; poll/select on it and call
 *   {@link module:socket.dispatchDrain} when it becomes readable.
 */
export function dispatchInit() {}

/**
 * Drain and execute any pending main-thread dispatch events (data handler
 * invocations, etc.) queued since the last drain. Call this from your
 * event loop whenever the fd from {@link module:socket.dispatchInit} is readable.
 * @returns {void}
 */
export function dispatchDrain() {}


