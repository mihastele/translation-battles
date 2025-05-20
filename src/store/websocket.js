import { useStore } from 'vuex';

export default {
    namespaced: true,
    state: () => ({
        socket: null,
        isConnected: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectInterval: 3000, // 3 seconds
    }),
    mutations: {
        SET_SOCKET(state, socket) {
            state.socket = socket;
        },
        SET_CONNECTION_STATUS(state, status) {
            state.isConnected = status;
        },
        INCREMENT_RECONNECT_ATTEMPTS(state) {
            state.reconnectAttempts++;
        },
        RESET_RECONNECT_ATTEMPTS(state) {
            state.reconnectAttempts = 0;
        },
    },
    actions: {
        initializeWebSocket({ commit, dispatch, state }) {
            // Close existing connection if any
            if (state.socket) {
                state.socket.close();
            }

            const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}${window.location.hostname}:8080`;
            
            const socket = new WebSocket(wsUrl);
            commit('SET_SOCKET', socket);

            socket.onopen = () => {
                console.log('WebSocket connected');
                commit('SET_CONNECTION_STATUS', true);
                commit('RESET_RECONNECT_ATTEMPTS');
                
                // Re-subscribe to any necessary channels or restore state
                const store = useStore();
                if (store.state.user.isAuthenticated) {
                    dispatch('reconnectUser', store.state.user);
                }
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('WebSocket message received:', message);
                    dispatch('handleWebSocketMessage', message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket disconnected');
                commit('SET_CONNECTION_STATUS', false);
                
                // Attempt to reconnect if not manually closed
                if (state.reconnectAttempts < state.maxReconnectAttempts) {
                    setTimeout(() => {
                        commit('INCREMENT_RECONNECT_ATTEMPTS');
                        console.log(`Attempting to reconnect (${state.reconnectAttempts}/${state.maxReconnectAttempts})`);
                        dispatch('initializeWebSocket');
                    }, state.reconnectInterval);
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            return socket;
        },

        closeWebSocket({ state, commit }) {
            if (state.socket) {
                state.socket.close();
                commit('SET_SOCKET', null);
                commit('SET_CONNECTION_STATUS', false);
            }
        },

        sendMessage({ state }, message) {
            if (state.socket && state.isConnected) {
                try {
                    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
                    state.socket.send(messageStr);
                    return true;
                } catch (error) {
                    console.error('Error sending WebSocket message:', error);
                    return false;
                }
            } else {
                console.warn('WebSocket is not connected');
                return false;
            }
        },

        async handleWebSocketMessage({ commit, dispatch }, message) {
            switch (message.type) {
                case 'lobby_created':
                    commit('SET_CURRENT_LOBBY', message.lobby);
                    break;
                case 'player_joined':
                    commit('ADD_PLAYER_TO_LOBBY', message.player);
                    break;
                case 'player_left':
                    commit('REMOVE_PLAYER_FROM_LOBBY', message.playerId);
                    break;
                case 'player_ready':
                    commit('UPDATE_PLAYER_STATUS', {
                        playerId: message.playerId,
                        status: 'ready'
                    });
                    break;
                case 'game_started':
                    commit('SET_GAME_STATE', 'in_progress');
                    break;
                case 'round_started':
                    commit('SET_CURRENT_ROUND', message.round);
                    break;
                case 'round_ended':
                    commit('UPDATE_SCORES', message.scores);
                    break;
                case 'game_ended':
                    commit('SET_GAME_STATE', 'ended');
                    commit('SET_WINNER', message.winner);
                    break;
                case 'error':
                    console.error('WebSocket error:', message.error);
                    // You might want to show this error to the user
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        },

        // Action to reconnect user after WebSocket reconnection
        reconnectUser({ state, dispatch }, user) {
            if (state.currentLobby) {
                dispatch('joinLobby', state.currentLobby.id);
            }
        },
    },
};
