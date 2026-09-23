# qjs-networking

This repository contains C module networking capabilities for Bellard QuickJS version 2025-09-13:

- **socket.c** defines TCP and TLS socket Client and Server classes
- **libdatachan.c** defines a DataChannel class that creates a WebRTC back-pressuredatachannel

A third C module, **webview.c** adds a webview-based browser to QuickJS that supports the two networking C modules.

These C modules are used in the following example QuickJS applications:

- **net** TCP socket client and server with TLS support
- **wsHttpServer** Websocket and HTTP server
- **webrtc** Peer-to-peer client file transfer over webrtc data channel that uses the [Brume](https://brume.occams.solutions) signaling server
- **webview** A webview browser integrated socket and datachannel capabilites.

## Repository Organization

- **brume-test-server/** local websocket and http server for testing
- **datachannel_c_module/** source and build for libqjsdatachannel
- **dispatch_c_module/** source and build for libqjsdispatch
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

Qjs-networking socket and WebRTC C nodules pass asynchronous network data and events to generated on C background threads to the JS main thread in different ways:

- **FD Mode** In a headless QuickJS environment that supports ```os.setReadHandler(fd, handlerFn)```, the C backend:
  - Creates a socket (TCP socket case) or pair of pipes to a background thread (TLS socket or WebRTC datachannel case)
  - Passes the read FD back to JS to be used with setReadHandler
  - Writes network events/data to the write FD

  JS on the main thread loops on ```os.setReadHandler(fd, handlerFn)``` to read backend events.

- **Dispatch Mode** The QuickJS environment needs to expose an interface that the backend uses to inject network data/events into the JS main thread. The Webview C Module uses the C ```webview_dispatch(window, handlerFn, event)```:
  - Happens once:
    - JS: ```cModClassInstance.setEventHandler( handlerFn )``` registers ```handlerFn``` as js_callback that gets stored in the context of the C Module main thread.
    - The webview ctor registers a function ```webview_dispatch_impl```.

  - On datachannel background channel message arrival:
    - dc_emit_msg: ev = { js_callback, msg_type, msg_length, data },  calls js_dispatch_to_main(main_thread_dispatch_fn, ev).
    - js_dispatch_to_main: calls webview_dispatch_impl(main_thread_dispatch_fn, ev)
    - webview_dispatch_impl: sets dw = {main_thread_dispatch_fn, ev} and then calls ```webview_dispatch( webview_dispatch_fn, dw)``` that returns immediately, allowing the background thread to continue running.

  - At some point later on the main thread the GUI event loop runs ```webview_dispatch_fn(dw)```:
    - webview_dispatch_fn: ```dw->main_thread_dispatch_fn(dw->ev)```
    - main_thread_dispatch_fn: js_arg is constructed from ev fields, then calls ```ev->js_callback(js_arg)``` that invoke the JS message handler.

The net and webrtc examples are both headless QuickJS applications and use **FD Mode**. The webview example requires **Dispatch Mode**. Headless QuickJS apps can be run in **Dispatch Mode**. While QuickJS does not have an equivalent to ```webview_dispatch```, sending a wake_up message over a pipe to be read by ```os.setReadHandler``` accomplishes a similar thing. Then, the readHandler function can pull events/data from the C modules. While **FD Mode** is simpler, there may be scenarios where pipe capacity or speed constraints make **Dispatch Mode** a better fit. The examples client.js-dispatch and p2pClinet.mjs-dispatch illustrate how this is done.

# License

Software license: Creative Commons Attribution-NonCommercial 4.0 International

**THIS SOFTWARE COMES WITHOUT ANY WARRANTY, TO THE EXTENT PERMITTED BY APPLICABLE LAW.**
