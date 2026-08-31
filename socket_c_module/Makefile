CC = clang

CFLAGS = -O2 -g -Wall -fPIC  -I/usr/local/include/quickjs -I/opt/homebrew/opt/openssl/include  -I../include
CXXFLAGS = -std=c++11 -DWEBVIEW_COCOA -I.
LDFLAGS = \
	-L/usr/local/lib/quickjs -lquickjs \
	-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \

all: ../lib/libqjssocket.a socket.so

js_dispatch.o: js_dispatch.c
	$(CC) $(CFLAGS) -c js_dispatch.c -o js_dispatch.o

socket.o: socket.c
	$(CC) $(CFLAGS) -c socket.c -o socket.o


socket.so: socket.c js_dispatch.c
	$(CC) $(CFLAGS) -fPIC -shared -DJS_SHARED_LIBRARY -o socket.so socket.c  js_dispatch.c $(LDFLAGS)

../lib/libqjssocket.a: socket.o js_dispatch.o
	mkdir -p ../lib
	ar rcs $@ $^

.PHONY: clean

clean:
	rm -rf *.o
