QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O0 -g -Wall -fPIC -I/usr/local/include/quickjs -I/opt/homebrew/opt/openssl/include -I../include
LDFLAGS = -L/usr/local/lib/quickjs -lquickjs -L/opt/homebrew/opt/openssl/lib -lssl -lcrypto -lm -lpthread -ldl

all: client server

js_dispatch.o: js_dispatch.c
	$(CC) $(CFLAGS) -c js_dispatch.c -o js_dispatch.o

# socket
socket.o: socket.c
	$(CC) $(CFLAGS) -c socket.c -o socket.o

socket.so: socket.c
	$(CC) -fPIC -shared -DJS_SHARED_LIBRARY -o socket.so socket.c $(CFLAGS) $(LDFLAGS)

# client
client.c: client.js EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o client.c client.js

client.o: client.c
	$(CC) $(CFLAGS) -c client.c -o client.o

client: client.o socket.o js_dispatch.o
	$(CC) $(LDFLAGS) -o client client.o socket.o js_dispatch.o

# server
server.c: server.js EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o server.c server.js

server.o: server.c
	$(CC) $(CFLAGS) -c server.c -o server.o

server: server.o socket.o js_dispatch.o
	$(CC) $(LDFLAGS) -o server server.o socket.o js_dispatch.o


.PHONY: clean

clean:
	rm -rf *.o client.c server.c socket.so.dSYM client server
