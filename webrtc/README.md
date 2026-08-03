# webrtc

Create QuickJS peer-to-peer applications that use:

- websockets to an AWS hosted service called [Brume](https://brume.occams.solutions) that exchanges WEBRTC SDP offers and answers and ICE candidates between Brume users to create peer-to-peer WEBRTC data channels.
- QuickJS wrapper (qjsPeer.mjs and libdatachan.c) for [libdatachannel](https://libdatachannel.org/) to create webrtc data priority, back pressure data channels.

The example peer-to-peer application (p2pClient.mjs) opens a websocket connection to Brume using wsClient.mjs. Then, creates a peer instance (qjsPeer.mjs) that use the Brume websocket to exchange WEBRTC messages that create a data channel (libdatachan.c).

The example uses the data channel for file transfer and illustrates how priority queues and backpressure are used. Three data channel queues are created: cmd, transfer and chunk. Queues can be "real" and are arrays that act as a FIFO, or "virtual", in which case the queue data is generated dynamically, e.g. by reading a file. Cmd's have the highest priority. A file transfer cmd is treated as second priority and initiates a handshake to transfer a file. The chunk queue is virtual and reads file data streamed as chunks. Only one file transfer is allowed at a time. This is accomplished by blocking the transfer queue while the chunk queue is active. Queues are serviced until libdatachannel internal buffers reach a high water mark, then resume when the buffers hit a low water mark.

**NOT IMPLEMENTED YET** Use of priorityChannel queues is optional. If not specified, a single 'default' priority channel is used for all messages.

## wsClient.mjs

Create a websocket client.

```
import { newWsClient } from './wsClient.mjs';
const wsc = newWsClient( url \[ , token \] );
```

- url: websocket server
- token: optional authentication token. For Brume, AWS JWT IdToken
- Returns: WsEndpoint client instance

## qjsPeer.mjs

This exports the class QjsPeer that provides a JavaScript API to the libdatachannel C API.

A note on design: QjsPeer and libdatachannel run in the same single threaded QuickJS runtime and context. Blocking of messages over the data channel to QjsPeer and back is prevented in the following way. QjsPeer and libdatachannel exchange messages over a pair of pipes. libdatachannel processes remote peer messages on separate threads that pass the message data to QjsPeer over the pipe. QjsPeer uses os.setReadHandler for the pipe from libdatachannel that executes on a separate thread. Messages from QjsPeer are sent on the main thread over the pipe to libdatachannel and are either processed or sent over the data channel to the remote peer. The main thread is never blocked waiting for remote peer data and only blocked for the time taken for message processing and transmission to the remote.

### Constructor

```
import { QjsPeer } from './qjsPeer.mjs';
const peer = QjsPeer( {initiator, label})
```

- initiator: optional boolean true if if initiating the connection. false or absent if not
- label: optional string label for the data channel

### Events

connect: called with function to execute on when peer is connected.

data: called with received data: string literal or ArrayBuffer

disconnect: peer disconnected

sdp: called with locally generated SDP

### methods

close(): close the data channel

createQueues(queuesOrder): Optionally defined queues and their priority order
- queuesOrder: array of string literal queue names ordered by descending priority

on(event, handler): register event handler function
- event: string event name
- handler: event handler function

send({type, data}): message to peer
- type: string data type
- data: string or Uint8Array data

signal(msg): pass remote SDP to libdatachannel
- msg: {type, sdp}
	- type: 'offer' or 'answer', libdatachannel action depends on type
	- sdp: remote SDP

### properties

agent: instance of the libdatachannel agent

initiator: true if this peer initated the peer connection

listeners: object with event name keys and handler properties

myName: Brume username of this peer

peerName: Brume username of remote peer

priorityChannel: instance of PriorityChannel used between peers

typeToQueue: function that defines how message types are assigned to queues

## libdatachan.c

libdatachan.c is a QuickJS C module that exports a subset of the libdatachan C API.

### Constructor

```
import { PeerConnection } from './dc.so';
this.agent = new PeerConnection( {
	stun_host: "stun.l.google.com",
	stun_port: 19302,
	initiator,
	label
} );
```

- stun_host, stun_port: stun server to use
- initiator: true is starting data channel, false otherwise
- label: string label

### Methods

close(): close the data channel

connect(sdp) Called by peer receiving an offer
	- sdp: from initiator

getBufferedAmount()
	- returns size of data channel yet to be sent

sendBuf(aBuf)
	- aBuf: ArrayBuffer to send over data channel

sendText(str)
	- str: text to send over the data channel

setRemoteDescription(sdp) Called by the initiator on answer
	- sdp: from the peer

### Properties

Message types libdatachan.c -> qjsPeer.mjs
	- MSG_SDP: remote peer SDP
	- MSG_DATA: data from remote peer
	- MSG_CONNECTED: data channel connected
	- MSG_DISCONNECTED:  data channel disconnected
	- MSG_DC_OPEN: data chanel open to use
	- MSG_DC_CLOSE: data channel closed
	- MSG_BUFFERED_LOW: data channel low-water mark reached

Message types qjsPeer.mjs -> libdatachan.c
	- MSG_CLOSE: close the datachannel
	- MSG_DATA: data to send to remote peer

# Building

```
git clone https://github.com/boblund/qjs-networking.git
cd qjs-networking/webrtc
```

Install libdatachannel

```
git clone https://github.com/paullouisageneau/libdatachannel.git
cd libdatachannel
git submodule update --init --recursive --depth 1
cmake -B build \
	-DCMAKE_BUILD_TYPE=Release \
	-DCMAKE_C_COMPILER=/usr/bin/clang \
	-DCMAKE_CXX_COMPILER=/usr/bin/clang++ \
	-DUSE_GNUTLS=0 \
	-DUSE_MBEDTLS=0 \
	-DNO_MEDIA=1 \
	-DNO_WEBSOCKET=1 \
	-DBUILD_SHARED_LIBS=OFF
cmake --build build -j$(sysctl -n hw.logicalcpu)
```

Copy the build artifacts to the locations assumed by the Makefile. Adjust if desired.

```
mkdir -p /usr/local/include/libdatachannel
cp -r libdatachannel/include/rtc /usr/local/include/libdatachannel/
mkdir -p /usr/local/lib/libdatachannel
cp build/libdatachannel.a build/deps/libjuice/libjuice.a build/deps/usrsctp/usrsctplib/libusrsctp.a /usr/local/lib/libdatachannel/
```

Make webrtc p2pClient

```
cd ..
make p2pClient
```

Start a p2pClient receiver with \<Brume_user_1> in a terminal.
```
./p2p \<config file location for Brume_user_1>
```

Start a p2pClient sender with \<Brume_user_2> in another terminal.
```
./p2p \<config file location for Brume_user_2> \<Brume_user_1>
```

# License

Software license: Creative Commons Attribution-NonCommercial 4.0 International

**THIS SOFTWARE COMES WITHOUT ANY WARRANTY, TO THE EXTENT PERMITTED BY APPLICABLE LAW.**
