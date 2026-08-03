# qjs-networking

This repo provides C modules that add networking capabilities to Bellard QuickJS version 2025-09-13:
- net: TCP socket client and server with TLS support
- wsHttpServer: Websocket and HTTP server
- webrtc: webrtc data channel that uses the [Brume](https://brume.occams.solutions) signaling server
- plus useful associated tools

## Overview

Two QuickJS C modules provide the core network connectivity:
- socket.c exposes Client and Server classes that provide a JavaScript (JS) TCP and TCP TLS socket API.
- libdatachan.c exposes a subset of libdatachannel C apis to JS for creating webrtc data channels with multiple priority queues.

The three directories net, webrtc and wsHttpServer are examples of socket client/server, p2p using webrtc and websocket/HTTP server, respectively. Each directory has its own README.md that describes how to use the code.

The repo root directory contains socket.c, EncodeDecode.c wsEndpoint.mjs used in net, webrtc and wsHttpServer.

## EncodeDecode.mjs

Exports classes:
- TextEncoder/TextDecode: Convert UTF-8 string to/from Uint8Array
- toBase64/fromBase64: Convert base64 string from/to Uint8Array

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
