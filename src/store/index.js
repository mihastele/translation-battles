import { createStore } from 'vuex'

export default createStore({
    state: {
        user: {
            id: null,
            username: '',
            isAuthenticated: false
        },
        activeLobbies: [],
        currentLobby: null,
        gameSettings: {
            mode: 'single-word', // or 'fill-blank'
            difficulty: 'easy',
            rounds: 10
        }
    },
    getters: {
        isAuthenticated(state) {
            return state.user.isAuthenticated
        },
        currentLobby(state) {
            return state.currentLobby
        },
        activeLobbies(state) {
            return state.activeLobbies
        }
    },
    mutations: {
        setUser(state, user) {
            state.user = user
        },
        setActiveLobbies(state, lobbies) {
            state.activeLobbies = lobbies
        },
        setCurrentLobby(state, lobby) {
            state.currentLobby = lobby
        },
        setGameSettings(state, settings) {
            state.gameSettings = { ...state.gameSettings, ...settings }
        },
        addPlayerToLobby(state, player) {
            if (state.currentLobby) {
                state.currentLobby.players.push(player)
            }
        },
        removePlayerFromLobby(state, playerId) {
            if (state.currentLobby) {
                state.currentLobby.players = state.currentLobby.players.filter(
                    player => player.id !== playerId
                )
            }
        },
        updatePlayerStatus(state, { playerId, status }) {
            if (state.currentLobby) {
                const player = state.currentLobby.players.find(p => p.id === playerId)
                if (player) {
                    player.status = status
                }
            }
        }
    },
    actions: {
        login({ commit }, username) {
            // In a real app, this would make an API call
            const userId = 'user_' + Math.random().toString(36).substr(2, 9)
            commit('setUser', {
                id: userId,
                username,
                isAuthenticated: true
            })
            return userId
        },
        fetchLobbies({ commit }) {
            return fetch('http://localhost:8000/index.php/lobbies')
                .then(res => res.json())
                .then(data => commit('setActiveLobbies', data))
                .catch(err => console.error('Failed to fetch lobbies:', err));
        },
        createLobby({ commit, state }, lobbyData) {
            return fetch('http://localhost:8000/index.php/lobbies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: lobbyData.name,
                    host: state.user.id,
                    username: state.user.username,
                    gameMode: lobbyData.gameMode,
                    maxPlayers: lobbyData.maxPlayers
                })
            })
            .then(res => res.json())
            .then(newLobby => {
                // Ensure the current user is in the players list
                if (newLobby.players && !newLobby.players.some(p => p.id === state.user.id)) {
                    newLobby.players.push({
                        id: state.user.id,
                        username: state.user.username,
                        status: 'ready',
                        isHost: true,
                        score: 0
                    });
                }
                commit('setCurrentLobby', newLobby);
                return newLobby;
            })
            .catch(err => {
                console.error('Failed to create lobby:', err);
                throw err;
            });
        },
        joinLobby({ commit, state }, lobbyId) {
            return fetch(`http://localhost:8000/index.php/lobbies/${lobbyId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.user.id, username: state.user.username })
            })
            .then(res => res.json())
            .then(updatedLobby => {
                commit('setCurrentLobby', updatedLobby);
                return updatedLobby;
            })
            .catch(err => {
                console.error('Failed to join lobby:', err);
                return null;
            });
        },
        leaveLobby({ commit, state }) {
            if (state.currentLobby) {
                return fetch(`http://localhost:8000/index.php/lobbies/${state.currentLobby.id}/leave`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: state.user.id })
                })
                .then(res => res.json())
                .then(() => {
                    commit('setCurrentLobby', null);
                })
                .catch(err => console.error('Failed to leave lobby:', err));
            }
        },
        setPlayerReady({ commit, state, dispatch }, isReady) {
            if (!state.currentLobby || !state.user.id) return Promise.reject('No active lobby or user');
            
            const status = isReady ? 'ready' : 'not-ready';
            
            // First update local state for immediate feedback
            commit('updatePlayerStatus', {
                playerId: state.user.id,
                status: status
            });
            
            // Then sync with server
            return fetch(`http://localhost:8000/index.php/lobbies/${state.currentLobby.id}/ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: state.user.id,
                    status: status
                })
            })
            .then(res => res.json())
            .then(updatedLobby => {
                commit('setCurrentLobby', updatedLobby);
                return updatedLobby;
            })
            .catch(err => {
                console.error('Failed to update ready status:', err);
                // Revert local changes if server update fails
                commit('updatePlayerStatus', {
                    playerId: state.user.id,
                    status: isReady ? 'not-ready' : 'ready'
                });
                throw err;
            });
        }
    }
})