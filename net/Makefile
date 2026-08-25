QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O0 -g -Wall -fPIC -I/usr/local/include/quickjs -I/opt/homebrew/opt/openssl/include
LDFLAGS = -L/usr/local/lib/quickjs -lquickjs -L/opt/homebrew/opt/openssl/lib -lssl -lcrypto -lm -lpthread -ldl

SOCKET_C = ../socket.c
JS_DISPATCH = ../js_dispatch

all: socket.o socket.so client server

# socket
socket.o: $(SOCKET_C) $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -c $(SOCKET_C) -o socket.o

socket.so: $(SOCKET_C) $(JS_DISPATCH).h
	$(CC) -fPIC -shared -DJS_SHARED_LIBRARY -o socket.so $(SOCKET_C) $(CFLAGS) $(LDFLAGS)

js_dispatch.o: $(JS_DISPATCH).c $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -c $(JS_DISPATCH).c -o js_dispatch.o

# client
client.c: client.js ../EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o client.c client.js

client.o: client.c
	$(CC) $(CFLAGS) -c client.c -o client.o

client: client.o socket.o js_dispatch.o
	$(CC) $(LDFLAGS) -o client client.o socket.o js_dispatch.o

# server
server.c: server.js ../EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o server.c server.js

server.o: server.c
	$(CC) $(CFLAGS) -c server.c -o server.o

server: server.o socket.o js_dispatch.o
	$(CC) $(LDFLAGS) -o server server.o socket.o js_dispatch.o


.PHONY: clean

clean:
	rm -rf *.o client.c server.c socket.so.dSYM client server
