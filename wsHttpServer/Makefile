QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O2 -Wall -fPIC -I/usr/local/include/quickjs -I/opt/homebrew/opt/openssl/include
LDFLAGS = -L/usr/local/lib/quickjs -lquickjs -L/opt/homebrew/opt/openssl/lib -lssl -lcrypto -lm -lpthread -ldl

SOCKET_C = ../socket.c
ENCODEDECODE_MJS = ../EncodeDecode.mjs
WSENDPOINT_MJS = ../wsEndpoint.mjs
JS_DISPATCH = ../js_dispatch

all: wsHttpServer

OS := $(shell uname -s)
JQ := $(shell which jq)

ifeq ($(OS), Linux)
DATE_EPOCH = date -u -d "$$r" +%s
DATE_TOUCH = date -d "@$$r_epoch" '+%Y%m%d%H%M.%S'
else ifeq ($(OS), Darwin)
DATE_EPOCH = date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$$r" +%s
DATE_TOUCH = date -j -r "$$r_epoch" '+%Y%m%d%H%M.%S'
endif

all: wsHttpServer

socket.o: $(SOCKET_C) $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -c $(SOCKET_C) -o socket.o

socket.so: $(SOCKET_C) $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -shared -DJS_SHARED_LIBRARY -o socket.so $(SOCKET_C) $(LDFLAGS)

js_dispatch.o: $(JS_DISPATCH).c $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -c $(JS_DISPATCH).c -o js_dispatch.o

bundleFiles: bundleFiles.mjs $(ENCODEDECODE_MJS)
	$(QJSC) -o bundleFiles bundleFiles.mjs

HTTP_PATHS_FILES := $(shell find files -type f) #$(wildcard files/*)
print-http:
	@echo $(HTTP_PATHS_FILES)

httpPaths.mjs: $(HTTP_PATHS_FILES) bundleFiles
	./bundleFiles $(HTTP_PATHS_FILES)

# wsHttpServer
wsHttpServer.c: wsHttpServer.js httpPaths.mjs $(ENCODEDECODE_MJS) http.mjs ws.mjs sha1.mjs $(WSENDPOINT_MJS)
	$(QJSC) -e -M socket.so,socket -o wsHttpServer.c wsHttpServer.js

wsHttpServer.o: wsHttpServer.c
	$(CC) $(CFLAGS) -c wsHttpServer.c -o wsHttpServer.o

wsHttpServer: wsHttpServer.o socket.o js_dispatch.o
	$(CC) $(LDFLAGS) -o wsHttpServer wsHttpServer.o socket.o js_dispatch.o

.PHONY: clean

clean:
	rm -f *.o wsHttpServer.c bundleFiles
