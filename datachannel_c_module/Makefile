QJSC = /usr/local/bin/qjsc
CC = gcc
CFLAGS = -O2 -g -Wall -fPIC \
			-I/usr/local/include/quickjs \
			-I../include/libdatachannel \
			-I../include

all: ../lib/libqjsdatachannel.a

libdatachan.o: libdatachan.c
	$(CC) $(CFLAGS) -c libdatachan.c -o libdatachan.o

../lib/libqjsdatachannel.a: libdatachan.o
	mkdir -p ../lib
	rm -f $@
	ar rcs $@ $^

.PHONY: clean

clean:
	rm -f *.o
