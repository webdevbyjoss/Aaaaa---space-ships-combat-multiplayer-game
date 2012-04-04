#!/usr/bin/env python

import socket
import threading
import struct
import hashlib
import base64

PORT = 9999


def create_handshake_resp(handshake):
    final_line = ""
    lines = handshake.splitlines()
    for line in lines:
        parts = line.partition(": ")
        if parts[0] == "Sec-WebSocket-Key":
            key = parts[2]
        elif parts[0] == "Sec-WebSocket-Version":
            version = parts[2]
        elif parts[0] == "Host":
            host = parts[2]
        elif parts[0] == "Origin":
            origin = parts[2]
        final_line = line
    # according to http://tools.ietf.org/html/draft-ietf-hybi-thewebsocketprotocol-17
    guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    token = key + guid
    token = base64.b64encode(hashlib.sha1(token).digest())

    return (
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: WebSocket\r\n"
        "Connection: Upgrade\r\n"
        "Content-Type: utf-8\r\n"
        "Sec-WebSocket-Origin: %s\r\n"
        "Sec-WebSocket-Location: ws://%s/\r\n"
        "Sec-WebSocket-Accept: %s\r\n"
        "\r\n"
        ) % (origin, host, token)


def handle(s, addr):
    data = s.recv(1024)
    s.send(create_handshake_resp(data))
    lock = threading.Lock()

    while 1:
        print "Waiting for data from", s, addr
        data = s.recv(1024)
        print "Done"
        if not data:
            print "No data"
            break
        
        print 'Data: ', data
        
        received_text = data.split('\xff')          
        #received_text  = cleanMsg(data) #.decode('utf-8') # encode('raw_unicode_escape')
        print 'Data from', addr, ':', received_text

        # Broadcast received data to all clients
        lock.acquire()
        [conn.send(data) for conn in clients]
        lock.release()

    print 'Client closed:', addr
    lock.acquire()
    clients.remove(s)
    lock.release()
    s.close()

def start_server():
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(('', PORT))
    s.listen(1)
    while 1:
        conn, addr = s.accept()
        print 'Connected by', addr
        clients.append(conn)
        # TODO: look for shutdown signal support here: https://gist.github.com/512987
        threading.Thread(target = handle, args = (conn, addr)).start()

clients = []
start_server()
