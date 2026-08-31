QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O0 -g -Wall -fPIC -I/usr/local/include/quickjs \
	-I/opt/homebrew/opt/openssl/include \
	-I../include

LDFLAGS = -L/usr/local/lib/quickjs -lquickjs \
	-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \
	-L../lib -lqjssocket \
	-lm -lpthread -ldl

all: client server

# client
client.c: client.js EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o client.c client.js

client.o: client.c
	$(CC) $(CFLAGS) -c client.c -o client.o

client: client.o
	$(CC) $(LDFLAGS) -o client client.o

# server
server.c: server.js EncodeDecode.mjs
	$(QJSC) -e -M socket.so,socket -o server.c server.js

server.o: server.c
	$(CC) $(CFLAGS) -c server.c -o server.o

server: server.o
	$(CC) $(LDFLAGS) -o server server.o


.PHONY: clean

clean:
	rm -rf *.o client.c client server
