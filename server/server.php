<?php
/**
 * Server configuration
 */
$address = '0.0.0.0';
$port = 9999;

/*
 * Define the absolute/relative paths to the library path, the app library path,
 * app path and the database configuration path
 */
define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/../app') );
define('APPLICATION_CACHE', realpath(APPLICATION_PATH . '/../tmp'));
define('APPLICATION_LIBRARY_PATH', realpath(APPLICATION_PATH . '/../library'));

$paths = ''; // $paths = explode(PATH_SEPARATOR, get_include_path());
$paths[] = '/usr/share/php/libzend-framework-php';
$paths[] = APPLICATION_LIBRARY_PATH;
set_include_path(implode(PATH_SEPARATOR, $paths));
unset($paths);

// init autoloading
require_once 'Zend/Loader/Autoloader.php';
$loader = Zend_Loader_Autoloader::getInstance();
$loader->registerNamespace(array('Aaaaa_'));

// bootstrap application
$_SERVER['SERVER_NAME'] = 'localhost'; // small hack to bootstrap 

// init db connection
$dbConfig = include(APPLICATION_PATH . '/config.php');
$db = Zend_Db::factory('Mysqli', $dbConfig);



error_reporting ( E_ALL );

/* Allow the script to hang around waiting for connections. */
set_time_limit ( 0 );

/* Turn on implicit output flushing so we see what we're getting
 * as it comes in. */
ob_implicit_flush ();

if (($sock = socket_create ( AF_INET, SOCK_STREAM, SOL_TCP )) === false) {
	echo "socket_create() failed: reason: " . socket_strerror ( socket_last_error () ) . "\n";
	exit();
}

if (socket_bind ( $sock, $address, $port ) === false) {
	echo "socket_bind() failed: reason: " . socket_strerror ( socket_last_error ( $sock ) ) . "\n";
	exit();
}

if (socket_listen ( $sock, 5 ) === false) {
	echo "socket_listen() failed: reason: " . socket_strerror ( socket_last_error ( $sock ) ) . "\n";
	exit();
}

echo "Websocket server started at $address:$port \nCtrl+C to close\n";

while (true) {
	if (($msgsock = socket_accept ( $sock )) === false) {
		echo "socket_accept() failed: reason: " . socket_strerror ( socket_last_error ( $sock ) ) . "\n";
		break;
	}
	
	// We got a client connected, lets process it in separate thread
	if (($pid = pcntl_fork()) === -1) {
		echo "pcntl_fork() failed. Make sure you are on Linux sustem, but not on Windows\n";
		break;		
	}
	
	if (!$pid) { // client
		handleClient($msgsock);
		exit();
	}
	// parent server process will now start new cycle and wait to accept more clients connections
}

socket_close ( $sock );





function handleClient($msgsock) {
	
	global $db;
	
	// say hello to client
	doHandshake($msgsock);
	
	echo "Got correct handshake\n";
	
	// use lib to encode/decode websocket frames
	// thanks to: http://code.google.com/p/phpws/source/browse/phpws/websocket.framing.php
	require_once 'websocket.framing.php';
	
	/**
	 * Update data in database
	 * and send information back to frontend
	 */
	$s = new Aaaaa_Service($db);
	
	// start ping/pong  messages session
	while (true) {
		if (false === ($buf = socket_read ( $msgsock, 2048, PHP_BINARY_READ ))) {
			echo "socket_read() failed: reason: " . socket_strerror ( socket_last_error ( $msgsock ) ) . "\n";
			return;
		}
		
		if (empty($buf)) { // do disconnection check
			echo "Client disconnected\n";
			return;
		}

		// decode message
		$frame = WebSocketFrame::decode($buf);
		$res = $frame->getData();
		$data = json_decode($res, true);
		
		/**
		 * Update player information
		 */
		if (empty($data['id'])) {
			$id = $s->updatePlayer($data);
		} else {
			$id = $s->updatePlayer($data, $data['id']);
		}

		/**
		 * Get information about other players
		 */
		$return = $s->getPlayers();
		
		/**
		 * Encode json into string and pack into Websocket frame 
		 */
		$returnFrame = WebSocketFrame::create($frame->getType(), json_encode($return))->encode();
		
		// transfer json object to client
		socket_write($msgsock, $returnFrame, strlen($returnFrame));
	}
	
	socket_close ( $msgsock );
}

function doHandshake($msgsock) {
	// get handshake from client
	if (false === ($buf = socket_read ( $msgsock, 2048, PHP_BINARY_READ ))) {
		echo "socket_read() failed: reason: " . socket_strerror ( socket_last_error ( $msgsock ) ) . "\n";
		return;
	}

	// send server handshake responce
	$responceHandshake = createHandshakeResponce($buf);
	socket_write ( $msgsock, $responceHandshake, strlen ( $responceHandshake ) );
}

function createHandshakeResponce($clientHandshake) {
	
	$handshakeTemplate = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: WebSocket\r\nConnection: Upgrade\r\n"
	. "Sec-WebSocket-Origin: %s\r\nSec-WebSocket-Location: ws://%s/\r\nSec-WebSocket-Accept: %s\r\n\r\n";
	
	// this GUID described in Websocket protocol
	// according to http://tools.ietf.org/html/draft-ietf-hybi-thewebsocketprotocol-17
	$GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
		
	$lines = explode("\r\n", $clientHandshake);
	foreach ($lines as $line) {
		// skip empty lines		
		if (empty($line) || (false === strpos($line, ': '))) {
			continue;
		}
		// parse headers
		list ($name, $v) = explode(': ', $line);
		switch ($name) {
			case 'Sec-WebSocket-Key':
				$key = $v;
				break;
			case 'Host':
				$host = $v;
				break;
			case 'Origin':
				$origin = $v;
				break;
			case 'Sec-WebSocket-Version':
				$version = intval($v);
				break;
		}
	}
	
	// according to lates Websockets protocol standard
	// take the SHA-1 hash and then base64-encoded
	$acceptToken = base64_encode(sha1($key . $GUID, true));
	
	return sprintf($handshakeTemplate, $origin, $host, $acceptToken);
}