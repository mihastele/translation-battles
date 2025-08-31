let socket = null;
const callbacks = new Map();
import store from '../store'

const initializeSocket = (playerId = null) => {
    if (socket && socket.readyState === WebSocket.OPEN) return socket;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8000/ws`;
    
    socket = new WebSocket(wsHost);
    socket.onopen = () => {
        console.log('WebSocket connected');
        // Send connection message with player ID if available
        if (playerId) {
            socket.send(JSON.stringify({ action: 'connect', playerId }));
        }
    };
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const { type, ...data } = message;
        
        // Call all registered callbacks for this message type
        if (callbacks.has(type)) {
            callbacks.get(type).forEach(callback => callback(data));
        }
        // Dispatch to Vuex store for state updates
        store.dispatch('websocket/handleWebSocketMessage', { type, ...data });
    };
    
    socket.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        socket = null; // Reset socket reference
        // Attempt to reconnect after a delay
        setTimeout(() => initializeSocket(playerId), 3000);
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    return socket;
};

export default {
    install: (app) => {
        // Make WebSocket available in all components via this.$ws
        app.config.globalProperties.$ws = {
            // Initialize WebSocket with player ID
            init: (playerId) => {
                return initializeSocket(playerId);
            },
            
            // Send a message to the WebSocket server
            send: (type, data = {}) => {
                const ws = socket || initializeSocket();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: type, ...data }));
                } else {
                    console.error('WebSocket is not connected');
                }
            },
            
            // Register a callback for a specific message type
            on: (type, callback) => {
                if (!callbacks.has(type)) {
                    callbacks.set(type, new Set());
                }
                callbacks.get(type).add(callback);
                
                // Return a function to unsubscribe
                return () => {
                    if (callbacks.has(type)) {
                        callbacks.get(type).delete(callback);
                    }
                };
            },
            
            // Join a lobby
            joinLobby: (lobbyId, playerName) => {
                const ws = socket || initializeSocket();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'joinLobby', lobbyId, playerName }));
                }
            },
            
            // Leave a lobby
            leaveLobby: (lobbyId, playerName) => {
                const ws = socket || initializeSocket();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'leaveLobby', lobbyId, playerName }));
                }
            },
            
            // Start the game
            startGame: (lobbyId) => {
                const ws = socket || initializeSocket();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'startGame', lobbyId }));
                }
            },
            
            // Submit an answer
            submitAnswer: (lobbyId, playerName, answer) => {
                const ws = socket || initializeSocket();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'submitAnswer', lobbyId, playerName, answer }));
                }
            }
        };
    }
};

// Export the WebSocket instance for direct use in stores or other non-component files
export const getWebSocket = () => {
    if (!socket) {
        throw new Error('WebSocket not initialized. Make sure to call app.use(websocket) first.');
    }
    return socket;
};
