<?php

$address = 'localhost';
$service_port = 9999;


error_reporting(E_ALL);

echo "<h2>TCP/IP Connection</h2>\n";

/* Create a TCP/IP socket. */
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if ($socket === false) {
	echo "socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n";
} else {
	echo "OK.\n";
}

echo "Attempting to connect to '$address' on port '$service_port'...";
$result = socket_connect($socket, $address, $service_port);
if ($result === false) {
	echo "socket_connect() failed.\nReason: ($result) " . socket_strerror(socket_last_error($socket)) . "\n";
} else {
	echo "OK.\n";
}

$in = "GET ws://aaaaa.localhost:9999/ HTTP/1.1\r\n";
$in .= "Origin: http://aaaaa.localhost\r\n";
$in .= "Connection: Upgrade\r\n";
$in .= "Host: aaaaa.localhost:9999\r\n";
$in .= "Sec-WebSocket-Key: Jb0+QyHLtVKu0Cwx5WF4Sg==\r\n";
$in .= "Upgrade: websocket\r\n";
$in .= "Sec-WebSocket-Version: 13\r\n";
$in .= "\r\n";

$out = '';

echo "Sending HTTP HEAD request...";
socket_write($socket, $in, strlen($in));
echo "OK.\n";

echo "Reading response:\n\n";
while ($out = socket_read($socket, 2048)) {
echo $out;
}

echo "Closing socket...";
socket_close($socket);
echo "OK.\n\n";