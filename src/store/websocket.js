import { createStore, useStore } from 'vuex';
import { initializeWebSocket, closeWebSocket, sendMessage } from '../plugins/websocket';

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
            const socket = initializeWebSocket();
            commit('SET_SOCKET', socket);
            commit('SET_CONNECTION_STATUS', socket.readyState === WebSocket.OPEN);
            return socket;
        },

        closeWebSocket({ state, commit }) {
            closeWebSocket();
            commit('SET_SOCKET', null);
            commit('SET_CONNECTION_STATUS', false);
        },

        sendMessage({ state }, message) {
            return sendMessage(message);
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
