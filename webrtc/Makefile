QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O2 -g -Wall -fPIC \
			-I/usr/local/include/quickjs \
			-I/opt/homebrew/opt/openssl/include

LDFLAGS = \
			-L/usr/local/lib/quickjs -lquickjs \
			-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \
			-L../lib/libdatachannel -ldatachannel -lusrsctp -ljuice \
			-L../lib -lqjsdc -lqjssocket \
			-lm -lpthread -ldl

all: p2pClient

p2pClient.c: p2pClient.mjs cognito.mjs parseUrl.mjs wsEndpoint.mjs wsClient.mjs EncodeDecode.mjs qjsPeer.mjs priorityChannel.mjs
	$(QJSC) -e -M socket.so,socket -M dc.so,dc -o p2pClient.c p2pClient.mjs

p2pClient.o: p2pClient.c
	$(CC) $(CFLAGS) -c p2pClient.c -o p2pClient.o

p2pClient: p2pClient.o ../lib/libqjsdc.a
	$(CC) $(LDFLAGS) -lc++ -o p2pClient p2pClient.o

.PHONY: clean

clean:
	rm -f *.o p2pClient.[co] p2pClient
