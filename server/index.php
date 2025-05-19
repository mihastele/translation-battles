<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$lobbiesFile = __DIR__ . '/lobbies.json';
if (!file_exists($lobbiesFile)) {
    file_put_contents($lobbiesFile, json_encode([]));
}
$lobbies = json_decode(file_get_contents($lobbiesFile), true);

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path);

if ($segments[0] !== 'lobbies') {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
    exit();
}

if ($method === 'GET' && count($segments) === 1) {
    echo json_encode($lobbies);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST' && count($segments) === 1) {
    $newLobby = [
        'id' => uniqid('lobby_'),
        'name' => $input['name'] ?? 'Lobby',
        'host' => $input['host'],
        'players' => [
            ['id' => $input['host'], 'username' => $input['username'], 'status' => 'ready']
        ],
        'gameMode' => $input['gameMode'] ?? 'single-word',
        'maxPlayers' => $input['maxPlayers'] ?? 4,
        'status' => 'waiting'
    ];
    $lobbies[] = $newLobby;
    file_put_contents($lobbiesFile, json_encode($lobbies));
    echo json_encode($newLobby);
    exit();
}

$lobbyId = $segments[1];
$lobbyIndex = array_search($lobbyId, array_column($lobbies, 'id'));
if ($lobbyIndex === false) { 
    http_response_code(404);
    echo json_encode(['error' => 'Lobby not found']);
    exit();
}

if ($method === 'POST' && isset($segments[2]) && $segments[2] === 'join') {
    $userId = $input['userId'];
    $username = $input['username'];
    foreach ($lobbies[$lobbyIndex]['players'] as $p) {
        if ($p['id'] === $userId) {
            echo json_encode($lobbies[$lobbyIndex]);
            exit();
        }
    }
    $lobbies[$lobbyIndex]['players'][] = ['id' => $userId, 'username' => $username, 'status' => 'not-ready'];
    file_put_contents($lobbiesFile, json_encode($lobbies));
    echo json_encode($lobbies[$lobbyIndex]);
    exit();
}

if ($method === 'POST' && isset($segments[2]) && $segments[2] === 'leave') {
    $userId = $input['userId'];
    $lobbies[$lobbyIndex]['players'] = array_values(array_filter($lobbies[$lobbyIndex]['players'], function($p) use ($userId) {
        return $p['id'] !== $userId;
    }));
    file_put_contents($lobbiesFile, json_encode($lobbies));
    echo json_encode($lobbies[$lobbyIndex]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
