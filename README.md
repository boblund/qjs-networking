# qjs-networking

This repositor provides networking capabilities for Bellard QuickJS version 2025-09-13. Two C modules have been developed that add the
core network connectivity:

- **socket.c** defines TCP and TLS socket Client and Server classes
- **libdatachan.c** defines a DataChannel class that creates a WebRTC back-pressuredatachannel

These C modules are used in the following example QuickJS applications:

- **net** TCP socket client and server with TLS support
- **wsHttpServer** Websocket and HTTP server
- **webrtc** peer-to-peer client file transfer over webrtc data channel that uses the [Brume](https://brume.occams.solutions) signaling server
- **webview**

A webview C module enables QuickJS app UI with integrated socket and datachannel capabilites.

## Repository Organization

- **brume-test-server/** local websocket and http server for testing
- **datachannel_c_module/** source and build for libqjsdatachannel
- **docs/** jsdoc generated documents for shared_src
- **include/** common C headers
- **lib/** generated for socket, datachannel and webview libs
- **net/** client/server socket example
- **shared_src/** shared JavaScript files for libs and examples
- **socket_c_module/** source and build for libqjssocket
- **tooling/** layout used by jsdoc
- **webview/** webview example
- **webview_c_module/** source and build for libqjswebview
- **webrtc/** peer-to-peer WebRTC example
- **wsHttpServer/** WebSocket/HTTP server example

## Using

### Install C libdatachannel

Create a temporary build directory

```
mkdir temp_build && cd temp_build
```

Download libdatachannel and build it.

```
git clone https://github.com/paullouisageneau/libdatachannel.git
cd libdatachannel
git submodule update --init --recursive --depth 1
```

Building instructions are [here](https://github.com/paullouisageneau/libdatachannel/blob/master/BUILDING.md). The instructions for
OSX did not work but the following did:

```
# on OSX
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

Copy required built libraries and include files

```
mkdir ../lib/libdatachannel
cp build/libdatachannel.a ../lib/libdatachannel/
cp build/deps/libjuice/libjuice.a ../lib/libdatachannel/
cp build/deps/usrsctp/usrsctplib/libusrsctp.a ../lib/../libdatachannel/
cp -r include/rtc ../include/
```

Remove temp_build

```
cd ../.. && rm -rf temp_build
```

### Make everything

In qjs-networking directory

```
make
```

This will make all C modules, libraries and docs, and install everything in the correct place. Then, make will be run in each application exampe directory. If an application is changed, run make in that directory. To remove all build artifacts

```
make clean
```

### Application details

Each application has its own README that describes how to use the application. The docuementation for the shared JavaScript (JS) files in shared_src are jsdocs in ./docs - open ./docs/index.html.

## Note For Developers

The QuickJS socket and datachannel C modules use threads for network communication and run asychronously with the JS main thread and WebView application. QuickJS and WebView have different methods available for threads to inject events to be processed:

- **FD Mode** The C module creates a pipe and gives the read file descriptor to JS. When a event occurs in a C module thread, it writes message_type_length, meesage_type, message_data to the pipe.

JS does ``` os.setReadHandler( fd, handler_function ); ``` and the handler_function reads the pipe and processes the message.

- **Dispatch Mode*** A WebView main thread blocks on ```webview.run()```; os.setReadHandler will not run when an event is written to the pipe. Instead of writing the event_buf to a file descriptor, the C module thread creates an event with the message_type and message_data and calls

```
js_dispatch_to_main(dc_message_main_thread, ev);
```





## Overview

Two QuickJS C modules provide the core network connectivity:
- socket.c exposes Client and Server classes that provide a JavaScript (JS) TCP and TCP TLS socket API.
- libdatachan.c exposes a subset of libdatachannel C apis to JS for creating webrtc data channels with multiple priority queues.

The three directories net, webrtc and wsHttpServer are examples of socket client/server, p2p using webrtc and websocket/HTTP server, respectively. Each directory has its own README.md that describes how to use the code.

The repo root directory contains socket.c, EncodeDecode.c wsEndpoint.mjs used in net, webrtc and wsHttpServer.

## EncodeDecode.mjs

Exports classes:
- **TextEncoder/TextDecode** Convert UTF-8 string to/from Uint8Array
- **toBase64/fromBase64** Convert base64 string from/to Uint8Array

## wsEndpoint.mjs

RFC6455 compliant websocket implementation that supports client or server. It is used in webrtc for a client that communicates with an AWS Lambda-based signaling server and in wsHttpServer for a websocket server.

### Constructor

```
const wsClient = new WsEndpoint(fd, socket, role);
const wsServer = new WsEndpoint(fd, socket, role);
```
- fd: socket file descriptor
- socket: the socket instance reference stored to insure it's not GC'd in instance's lifetime.
- role: 'client' or 'server'

### Events

- message: Message received: string if message is text or Uint8array if binary
- close: Websocket closed with string close reason
- pong: Pong control message received

```
wsClient.on( 'message', data => { ... } );
wsClient.on( 'close', reason => { ... } );
wsClient.on( 'pong', () => { ... } );
// same for wsServer
```

### Methods

- send: send string or Unit8Array message
- ping: send ping
- close: send close with numeric code and string reason

```
wsClient.send( messgae );
wsClient.ping();
wsClient.close( code, reason );
// same for wsServer
```

# License

Software license: Creative Commons Attribution-NonCommercial 4.0 International

**THIS SOFTWARE COMES WITHOUT ANY WARRANTY, TO THE EXTENT PERMITTED BY APPLICABLE LAW.**
