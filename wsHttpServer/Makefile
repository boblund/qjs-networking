QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = \
	-O2 -Wall -fPIC \
	-I/usr/local/include/quickjs \

LDFLAGS = \
	-L/usr/local/lib/quickjs -lquickjs \
	-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \
	-L../lib -lqjssocket \
	-lm -lpthread -ldl

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

bundleFiles: bundleFiles.mjs EncodeDecode.mjs
	$(QJSC) -o bundleFiles bundleFiles.mjs

HTTP_PATHS_FILES := $(shell find files -type f) #$(wildcard files/*)
print-http:
	@echo $(HTTP_PATHS_FILES)

httpPaths.mjs: $(HTTP_PATHS_FILES) bundleFiles
	./bundleFiles $(HTTP_PATHS_FILES)

wsHttpServer.c: wsHttpServer.js httpPaths.mjs EncodeDecode.mjs http.mjs ws.mjs sha1.mjs wsEndpoint.mjs
	$(QJSC) -e -M socket.so,socket -o wsHttpServer.c wsHttpServer.js

wsHttpServer.o: wsHttpServer.c
	$(CC) $(CFLAGS) -c wsHttpServer.c -o wsHttpServer.o

wsHttpServer: wsHttpServer.o
	$(CC) $(LDFLAGS) -o wsHttpServer wsHttpServer.o

.PHONY: clean

clean:
	rm -f *.o httpPaths.mjs wsHttpServer.c bundleFiles wsHttpServer
