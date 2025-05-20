let socket = null;
const callbacks = new Map();
import store from '../store'

const initializeSocket = () => {
    if (socket) return socket;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8080`;
    
    socket = new WebSocket(wsHost);
    socket.onopen = () => {
        console.log('WebSocket connected');
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
        // Attempt to reconnect after a delay
        setTimeout(initializeSocket, 3000);
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    return socket;
};

export default {
    install: (app) => {
        const ws = initializeSocket();
        
        // Make WebSocket available in all components via this.$ws
        app.config.globalProperties.$ws = {
            // Send a message to the WebSocket server
            send: (type, data = {}) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type, ...data }));
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
                ws.send(JSON.stringify({ action: 'joinLobby', lobbyId, playerName }));
            },
            
            // Leave a lobby
            leaveLobby: (lobbyId, playerName) => {
                ws.send(JSON.stringify({ action: 'leaveLobby', lobbyId, playerName }));
            },
            
            // Start the game
            startGame: (lobbyId) => {
                ws.send(JSON.stringify({ action: 'startGame', lobbyId }));
            },
            
            // Submit an answer
            submitAnswer: (lobbyId, playerName, answer) => {
                ws.send(JSON.stringify({ action: 'submitAnswer', lobbyId, playerName, answer }));
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
