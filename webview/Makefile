QJSC = /usr/local/bin/qjsc
CC = clang

CFLAGS = \
	-O2 -g -Wall -fPIC \
	-I/usr/local/include/quickjs \
	-I/opt/homebrew/opt/openssl/include \
	-I.

LDFLAGS = \
	-L/usr/local/lib/quickjs -lquickjs \
	-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \
	-L../lib/libdatachannel -ldatachannel -lusrsctp -ljuice \
	-L../lib -lqjsdc -lqjswebview -lqjssocket\
	-framework WebKit -framework Cocoa

all: webviewApp

webview.o: webview.c webview.h
	$(CC) $(CFLAGS) -c webview.c -o webview.o

webviewApp.c: webviewApp.mjs qjsPeer.mjs wsClient.mjs cognito.mjs
	$(QJSC) -e -M webview.so,webview -M socket.so,socket -M dc.so,dc -o webviewApp.c webviewApp.mjs

webviewApp.o: webviewApp.c
	$(CC) $(CFLAGS) -c webviewApp.c -o webviewApp.o

webviewApp: webviewApp.o
	$(CC) -lc++ webviewApp.o $(LDFLAGS) -o webviewApp

.PHONY: clean

clean:
	rm -f *.o webviewApp.[co] webviewApp
