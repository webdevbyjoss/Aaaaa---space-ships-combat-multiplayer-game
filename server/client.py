import socket;

HOST = 'localhost'
PORT = 9999

s = socket.socket()
s.connect((HOST,  PORT))
s.sendall('Hello!!!')
data = s.recv(1024)
s.close()

print 'Received ',   repr(data)
