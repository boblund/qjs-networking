CC = clang

CFLAGS = -O2 -g -Wall -fPIC -I/usr/local/include/quickjs -I../include
LDFLAGS = -L/usr/local/lib/quickjs -lquickjs

all: ../lib/libqjsdispatch.a dispatch.so

dispatch.o: dispatch.c #dispatch.h
	$(CC) $(CFLAGS) -c dispatch.c -o dispatch.o

../lib/libqjsdispatch.a: dispatch.o
	mkdir -p ../lib
	rm -f $@
	ar rcs $@ $^

dispatch.so: dispatch.c #dispatch.h
	$(CC) $(CFLAGS) -fPIC -shared -DJS_SHARED_LIBRARY -o dispatch.so dispatch.o $(LDFLAGS)

.PHONY: clean

clean:
	rm -f dispatch.o