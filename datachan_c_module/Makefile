QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O2 -g -Wall -fPIC \
			-I/usr/local/include/quickjs \
			-I../include/libdatachannel \
			-I../include

all: ../lib/libqjsdc.a

js_dispatch.o: js_dispatch.c ../include/js_dispatch.h
	$(CC) $(CFLAGS) -c js_dispatch.c -o js_dispatch.o

libdatachan.o: libdatachan.c
	$(CC) $(CFLAGS) -c libdatachan.c -o libdatachan.o

../lib/libqjsdc.a: libdatachan.o js_dispatch.o
	mkdir -p ../lib
	ar rcs $@ $^

.PHONY: clean

clean:
	rm -f *.o
