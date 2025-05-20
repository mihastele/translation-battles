<?php

namespace App\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class GameHandler implements MessageComponentInterface {
    protected $clients;
    protected $lobbies = [];

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        if (!$data) return;

        $action = $data['action'] ?? null;
        $lobbyId = $data['lobbyId'] ?? null;
        $playerName = $data['playerName'] ?? 'Anonymous';

        switch ($action) {
            case 'joinLobby':
                $this->joinLobby($from, $lobbyId, $playerName);
                break;
            case 'startGame':
                $this->startGame($lobbyId);
                break;
            case 'submitAnswer':
                $answer = $data['answer'] ?? '';
                $this->handleAnswer($lobbyId, $playerName, $answer);
                break;
            // Add more game actions as needed
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // Remove connection from clients
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
        
        // Remove from lobbies
        foreach ($this->lobbies as $lobbyId => &$lobby) {
            if (isset($lobby['players'][$conn->resourceId])) {
                $playerName = $lobby['players'][$conn->resourceId];
                unset($lobby['players'][$conn->resourceId]);
                $this->broadcastToLobby($lobbyId, [
                    'type' => 'playerLeft',
                    'playerName' => $playerName,
                    'players' => array_values($lobby['players'])
                ]);
                
                if (empty($lobby['players'])) {
                    unset($this->lobbies[$lobbyId]);
                }
                break;
            }
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    protected function joinLobby(ConnectionInterface $conn, $lobbyId, $playerName) {
        if (!isset($this->lobbies[$lobbyId])) {
            $this->lobbies[$lobbyId] = [
                'players' => [],
                'gameState' => 'waiting',
            ];
        }

        // Add player to lobby
        $this->lobbies[$lobbyId]['players'][$conn->resourceId] = $playerName;
        
        // Send updated player list to all clients in lobby
        $this->broadcastToLobby($lobbyId, [
            'type' => 'playerJoined',
            'playerName' => $playerName,
            'players' => array_values($this->lobbies[$lobbyId]['players']),
            'gameState' => $this->lobbies[$lobbyId]['gameState']
        ]);
    }

    protected function startGame($lobbyId) {
        if (!isset($this->lobbies[$lobbyId])) return;
        
        $this->lobbies[$lobbyId]['gameState'] = 'in_progress';
        
        $this->broadcastToLobby($lobbyId, [
            'type' => 'gameStarted',
            'gameState' => 'in_progress'
        ]);
    }

    protected function handleAnswer($lobbyId, $playerName, $answer) {
        if (!isset($this->lobbies[$lobbyId])) return;
        
        $this->broadcastToLobby($lobbyId, [
            'type' => 'answerSubmitted',
            'playerName' => $playerName,
            'answer' => $answer
        ]);
    }

    protected function broadcastToLobby($lobbyId, $message) {
        if (!isset($this->lobbies[$lobbyId])) return;
        
        $message = json_encode($message);
        
        foreach ($this->lobbies[$lobbyId]['players'] as $clientId => $playerName) {
            foreach ($this->clients as $client) {
                if ($client->resourceId === $clientId) {
                    $client->send($message);
                    break;
                }
            }
        }
    }
}
