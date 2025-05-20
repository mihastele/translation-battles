<?php

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use App\WebSocket\GameHandler;

require __DIR__ . '/vendor/autoload.php';

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new GameHandler()
        )
    ),
    8080 // WebSocket server port
);

echo "WebSocket server started on port 8080\n";
$server->run();
