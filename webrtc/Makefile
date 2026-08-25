QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O2 -g -Wall -fPIC \
			-I/usr/local/include/quickjs \
			-I/opt/homebrew/opt/openssl/include \
			-I/usr/local/include/libdatachannel

LDFLAGS = \
			-L/usr/local/lib/quickjs -lquickjs \
			-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \
			-L/usr/local/lib/libdatachannel -ldatachannel -lusrsctp -ljuice \
			-L. -lqjsdc \
			-lm -lpthread -ldl

SOCKET_C = ../socket.c
ENCODEDECODE_MJS = ../EncodeDecode.mjs
WSENDPOINT_MJS = ../wsEndpoint.mjs
JS_DISPATCH = ../js_dispatch

# socket
socket.o: $(SOCKET_C) $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -c $(SOCKET_C) -o socket.o

socket.so: $(SOCKET_C) $(JS_DISPATCH).h
	$(CC) -fPIC -shared -DJS_SHARED_LIBRARY -o socket.so $(SOCKET_C) $(CFLAGS) $(LDFLAGS)

# Datachannel version
js_dispatch.o: $(JS_DISPATCH).c $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -c $(JS_DISPATCH).c -o js_dispatch.o

libdatachan.o: libdatachan.c $(JS_DISPATCH).h
	$(CC) $(CFLAGS) -c libdatachan.c -o libdatachan.o

libqjsdc.a: libdatachan.o js_dispatch.o
	ar rcs $@ $^

p2pClient.c: p2pClient.mjs cognito.mjs parseUrl.mjs $(WSENDPOINT_MJS) wsClient.mjs $(ENCODEDECODE_MJS) qjsPeer.mjs priorityChannel.mjs
	$(QJSC) -e -M socket.so,socket -M dc.so,dc -o p2pClient.c p2pClient.mjs

p2pClient.o: p2pClient.c
	$(CC) $(CFLAGS) -c p2pClient.c -o p2pClient.o

p2pClient: p2pClient.o socket.o libqjsdc.a
	$(CC) $(LDFLAGS) -lc++ -o p2pClient p2pClient.o socket.o # libdatachan.o js_dispatch.o replaced by libqjsdc.a

.PHONY: clean

clean:
	rm -f *.o p2pClient.[co] p2pClient
