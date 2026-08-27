QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O2 -g -Wall -fPIC \
			-I/usr/local/include/quickjs \
			-I/opt/homebrew/opt/openssl/include \
			-I/usr/local/include/libdatachannel \
			-I../include

LDFLAGS = \
			-L/usr/local/lib/quickjs -lquickjs \
			-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \
			-L../lib/libdatachannel -ldatachannel -lusrsctp -ljuice \
			-L../lib -lqjsdc \
			-lm -lpthread -ldl

# socket
socket.o: socket.c
	$(CC) $(CFLAGS) -c socket.c -o socket.o

socket.so: socket.c
	$(CC) -fPIC -shared -DJS_SHARED_LIBRARY -o socket.so socket.c $(CFLAGS) $(LDFLAGS)

# Datachannel version
js_dispatch.o: js_dispatch.c
	$(CC) $(CFLAGS) -c js_dispatch.c -o js_dispatch.o

libdatachan.o: libdatachan.c
	$(CC) $(CFLAGS) -c libdatachan.c -o libdatachan.o

libqjsdc.a: libdatachan.o js_dispatch.o
	ar rcs $@ $^
	mkdir -p ../lib
	ln $@ ../lib/$@

p2pClient.c: p2pClient.mjs cognito.mjs parseUrl.mjs wsEndpoint.mjs wsClient.mjs EncodeDecode.mjs qjsPeer.mjs priorityChannel.mjs
	$(QJSC) -e -M socket.so,socket -M dc.so,dc -o p2pClient.c p2pClient.mjs

p2pClient.o: p2pClient.c
	$(CC) $(CFLAGS) -c p2pClient.c -o p2pClient.o

p2pClient: p2pClient.o socket.o libqjsdc.a
	$(CC) $(LDFLAGS) -lc++ -o p2pClient p2pClient.o socket.o # libdatachan.o js_dispatch.o replaced by libqjsdc.a

.PHONY: clean

clean:
	rm -f *.o p2pClient.[co] p2pClient
