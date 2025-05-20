<?php
class WebSocketService {
    private static $instance = null;
    private $pusher;
    
    private function __construct() {
        $options = [
            'cluster' => 'mt1',
            'useTLS' => false,
            'host' => '127.0.0.1',
            'port' => 6001,
            'scheme' => 'http'
        ];
        
        $this->pusher = new Pusher\Pusher(
            'app-key', // This is the default key for Soketi
            'app-secret', // This is the default secret for Soketi
            'app-id', // This is the default app ID for Soketi
            $options
        );
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function trigger($channel, $event, $data) {
        $this->pusher->trigger($channel, $event, $data);
    }
    
    public function getSocketId() {
        return $this->pusher->getSocketId();
    }
}

// Helper function to broadcast lobby updates
function broadcastLobbyUpdate($lobby) {
    $websocket = WebSocketService::getInstance();
    $websocket->trigger('lobby.' . $lobby['id'], 'lobby.updated', $lobby);
}

// Helper function to broadcast to all players in a lobby
function broadcastToLobby($lobbyId, $event, $data) {
    $websocket = WebSocketService::getInstance();
    $websocket->trigger('lobby.' . $lobbyId, $event, $data);
}
