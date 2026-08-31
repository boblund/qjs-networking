CC = clang
CXX = clang++

CFLAGS = -O2 -g -Wall -fPIC  \
	-I/usr/local/include/quickjs \
	-I../include -I.

CXXFLAGS = -std=c++11 -DWEBVIEW_COCOA -I.

LDFLAGS = \
	-L/usr/local/lib/quickjs -lquickjs

all: ../lib/libqjswebview.a

impl.o: impl.cc webview.h
	$(CXX) -c impl.cc $(CXXFLAGS) -o impl.o

js_dispatch.o: js_dispatch.c
	$(CC) $(CFLAGS) -c js_dispatch.c -o js_dispatch.o

# webview
webview.o: webview.c webview.h
	$(CC) $(CFLAGS) -c webview.c -o webview.o

webview.so: webview.o impl.o js_dispatch.o
	$(CXX) -shared -o webview.so webview.o js_dispatch.o impl.o $(LDFLAGS) -framework WebKit -framework Cocoa

../lib/libqjswebview.a: webview.o js_dispatch.o impl.o
	mkdir -p ../lib
	ar rcs $@ $^

.PHONY: clean

clean:
	rm -f *.o
