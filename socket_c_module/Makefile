CC = clang

CFLAGS = -O2 -Wall -fPIC  -I/usr/local/include/quickjs -I/opt/homebrew/opt/openssl/include  -I../include
CXXFLAGS = -std=c++11 -DWEBVIEW_COCOA -I.
LDFLAGS = \
	-L/usr/local/lib/quickjs -lquickjs \
	-L/opt/homebrew/opt/openssl/lib -lssl -lcrypto \
	-L../lib -lqjsdispatch

all: ../lib/libqjssocket.a socket.so

socket.o: socket.c ../include/js_dispatch.h
	$(CC) $(CFLAGS) -c socket.c -o socket.o


socket.so: socket.o
	$(CC) $(CFLAGS) -fPIC -shared -DJS_SHARED_LIBRARY -o socket.so socket.o $(LDFLAGS)

../lib/libqjssocket.a: socket.o
	mkdir -p ../lib
	rm -f $@
	ar rcs $@ $^

.PHONY: clean

clean:
	rm -rf *.o socket.so
