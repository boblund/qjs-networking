/**
 * priorityChannel module.
 * @module priorityChannel
 * @see module:priorityChannel
 */

/**
 * FIFO queue implemented on top of an Array.
 *
 * @extends Array
 */

class ArrayQueue extends Array{
	blocked = false;
	constructor(){ super(); }
	/**
   * Whether an item is available.
   *
   * @returns {boolean} True when the queue is nonempty.
   */

	ready(){ return this.length > 0; }

	/**
   * Remove and return the next queued item.
   *
   * @returns {*} The next item, or `undefined` when empty.
   */

	next(){ return this.shift(); }
}


/**
 * Class representing a back pressure sensitive, multi-prioity webrtc libdatachannel.
 */

export class PriorityChannel {
	#highWaterMark;
	#lowWaterMark; // just for documentation of what is set in dc_module.c
	#queues = {};
	#draining = false;
	#sendFn;
	#getHwFn;
	#queuesOrder;

	/**
	 * Create a PriorityChannel
	 * @param {function} sendFn send a priorityChannel message
	 * @param {function} getHwFn get the highwater mark of the actual channel
	 * @param {Array} queuesOrder priority ordered queue names
	 * @param {Int} [highWaterMark=65536] highwater threshold
	 * @param {Int} [lowWaterMark=16384] lowwater threshold
	 */
	constructor( { sendFn, getHwFn, queuesOrder, highWaterMark = 65536, lowWaterMark = 16384 } = {} ) {
		this.#highWaterMark = highWaterMark;
		this.#lowWaterMark = lowWaterMark;
		this.#queues = {};
		this.#draining = false;
		if( !sendFn || !getHwFn || !queuesOrder ) throw( 'new PriorityChannel: sendFn, getHwFn or queuesOrder not defined' );
		this.#sendFn = sendFn;
		this.#getHwFn = getHwFn;
		this.#queuesOrder = queuesOrder;
	}

	/**
	 * Add a queue
	 * @param {string} name to add
	 * @param {ArrayQueue} [queueImpl=new ArrayQueue()] {@link module:priorityChannel~ArrayQueue ArrayQueue} implementation
	 */

	addQueue( name, queueImpl = new ArrayQueue ) { this.#queues[ name ] = queueImpl; }

	/**
	 * Delete a queue
	 * @param {string} name to delete
	 * @reuturns {undefined}
	 */

	deleteQueue( name ) { delete this.#queues[ name ]; };

	/**
	 * Set sending state of queue
	 * @param {string} q queue name
	 * @param {boolean} s state of queue: true to block, false for not blocked
	 * @returns {undefined}
	 */

	block( q, s ){ this.#queues[ q ].blocked = s; }

	/**
	 * Enqueue message
	 * @param {string} queueName queue name
	 * @param {string | Uint8Array} item message to send
	 * @returns {undefined}
	 */

	send( queueName, item ) {
		if( this.#queues[ queueName ]?.push ) {
			this.#queues[ queueName ].push( item );
			this.pump();
		}
	}

	/**
	 * Send queued messages until all queues are drained or highwater threshold reached
	 * @returns {undefined}
	 */

	pump() {
		if( this.#draining ) return;
		this.#draining = true;
		while ( this.#getHwFn() < this.#highWaterMark ) {
			const queuesItem = this.#queuesOrder.find( l => this.#queues[ l ]?.ready() && !this.#queues[ l ]?.blocked );
			if ( !queuesItem ) break; // nothing to send anywhere
			const queue = this.#queues[ queuesItem ];
			this.#sendFn( queue.next() );
		}
		this.#draining = false;
	}
}
