QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O0 -g -Wall -fPIC -I/usr/local/include/quickjs -I/opt/homebrew/opt/openssl/include
LDFLAGS = -L/usr/local/lib/quickjs -lquickjs -L/opt/homebrew/opt/openssl/lib -lssl -lcrypto -lm -lpthread -ldl

SOCKET_C = ../socket.c

all: socket.o socket.so client server

# socket
socket.o: $(SOCKET_C)
	$(CC) $(CFLAGS) -c $(SOCKET_C) -o socket.o

socket.so: $(SOCKET_C)
	$(CC) -fPIC -shared -DJS_SHARED_LIBRARY -o socket.so $(SOCKET_C) $(CFLAGS) $(LDFLAGS)

# client
client.c: client.js ../EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o client.c client.js

client.o: client.c
	$(CC) $(CFLAGS) -c client.c -o client.o

client: client.o socket.o
	$(CC) $(LDFLAGS) -o client client.o socket.o

# server
server.c: server.js ../EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o server.c server.js

server.o: server.c
	$(CC) $(CFLAGS) -c server.c -o server.o

server: server.o socket.o
	$(CC) $(LDFLAGS) -o server server.o socket.o


.PHONY: clean

clean:
	rm -rf *.o client.c server.c socket.so.dSYM
