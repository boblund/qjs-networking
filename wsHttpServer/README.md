# wsHttpServer

wsHttpServer.mjs is a JavaScript ws/http server that supports TLS. It uses socket.c for TCP transport and can be compiled with qjsc into a standalone executable that includes HTML/JS/CSS static content. It is intended to be embedded in a QuickJS application to provide a user interface via a browser in single device or private network.

As QuickJS does not provide a filesystem, HTML, JavaScript, CSS and other web content files are bundled (bundleFiles.mjs) into an ES6 module(httpPaths.mjs) which is imported to serve that content.

# API
## http.mjs

Create a server.

http.createServer( ( req, resp ) => { ... } )
- req: request object { method, path, protocol, headers }
	- method, path, protocol: string literal of request method, path and protocol
	- headers: object with with entries {'header name': 'header value '}
- resp: instance of Response class
- returns: httpServer

```
import * as http from 'http.mjs';
const server = http.createServer( ( req, resp ) => {
	...
} );
```
### Response

Argument in http.createServer callback. Used to respond to the an HTTP request.

#### Methods
- setHeader( key, value ): add header 'key: value' to response. Overwrites key if present. Chunked transfer is used if key == 'Transfer-Encoding'.
- write( buf ): write to ArrayBuffer to socket
- end( buf ): write to ArrayBuffer to socket. If chunked transfer, end record

## httpServer
### methods
- listen(port, key, cert): start listening
	- port: port to listen on
	- key: optional server private key if socket is TLS
	- cert: server certificate required if key is specified
	- returns: undefined

- wsUpgrade( callbackFn): used by websocket server to set function httpServer calls when receiving a 'upgrade: websocket' request header.
	-callbackFn( headers, fds)
		headers: request headers
		fds: socket being upgraded

## ws.mjs

Create a server.

ws.createServer( { server } )
- server: result of http:createServer
- returns: instace of WebsocketServer
```
import * as ws from 'ws.mjs';
const wss = ws.createServer( { server } )
```
### Websocketserver
#### Constructor
const wss = ws.createServer( httpServer )
- httpServer: return value of http.createServer
- Returns: WsEndpoint server instance - see ../README.md for documentation

#### Events
- connection: Emitted when websocket connects. Argument is a WsEndpoint instance in server role see ../README.md for documentation.

#### Methods
wss.on(event, func) - registers a callback for event
- event: event name
- Returns: undefined

## Emdedded wsHttpServer web content

As QuickJS provides no file system and the design goal is a compiled, single executable application, web content to be served is transformed by bundleFiles.mjs into an ES6 modules httpPaths.mjs that is imported by wsHttpServer.mjs.

bundleFiles.mjs expects to find web content in './files'. It recursively generates the path to each file within './files' and creates an object 'paths'

```
const paths = {
  path1: { body, type },
	path2
	...
}
```
where:
	- body: is the content of path1 file
	- type: is the content-type of path1

Only the following types are supported: ico, png, html, js, mjs. html, js and mjs are stored as string literals. ico and png are stored as base64 encoded binary.

When complete, httpPaths.mjs is created which does:
```
export { paths }
```

# Using
qjs-socket was designed for and tested in Bellard QuickJS Compiler version 2025-09-13.

To compile wsHttpServer do:
```
make wsHttpServer
```
The contents of ./files are dependencies for wsHttpServer so make should be run if any changes to ./files are made.

To run wsHttpServer do:
```
./wsHttpServer port tls
```
to listen on 'port'. Specify tls to make the server wss/https, omit it for ws/http.

# License

Software license: Creative Commons Attribution-NonCommercial 4.0 International

**THIS SOFTWARE COMES WITHOUT ANY WARRANTY, TO THE EXTENT PERMITTED BY APPLICABLE LAW.**
