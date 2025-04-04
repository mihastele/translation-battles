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
            // Mock data for now - would be an API call in production
            const mockLobbies = [
                {
                    id: 'lobby1',
                    name: 'German Beginners',
                    host: 'user123',
                    players: [{ id: 'user123', username: 'GermanLearner', status: 'ready' }],
                    gameMode: 'single-word',
                    maxPlayers: 4,
                    status: 'waiting'
                },
                {
                    id: 'lobby2',
                    name: 'Advanced Translation',
                    host: 'user456',
                    players: [
                        { id: 'user456', username: 'LanguageMaster', status: 'ready' },
                        { id: 'user789', username: 'WordWizard', status: 'not-ready' }
                    ],
                    gameMode: 'fill-blank',
                    maxPlayers: 4,
                    status: 'waiting'
                }
            ]
            commit('setActiveLobbies', mockLobbies)
        },
        createLobby({ commit, state }, lobbyData) {
            // In a real app, this would make an API call
            const newLobby = {
                id: 'lobby_' + Math.random().toString(36).substr(2, 9),
                name: lobbyData.name,
                host: state.user.id,
                players: [{ id: state.user.id, username: state.user.username, status: 'ready' }],
                gameMode: lobbyData.gameMode,
                maxPlayers: lobbyData.maxPlayers || 4,
                status: 'waiting'
            }
            commit('setCurrentLobby', newLobby)
            return newLobby
        },
        joinLobby({ commit, state }, lobbyId) {
            // Find the lobby in active lobbies
            const lobby = state.activeLobbies.find(l => l.id === lobbyId)
            if (lobby) {
                // Add current user to the lobby
                const updatedLobby = {
                    ...lobby,
                    players: [
                        ...lobby.players,
                        { id: state.user.id, username: state.user.username, status: 'not-ready' }
                    ]
                }
                commit('setCurrentLobby', updatedLobby)
                return updatedLobby
            }
            return null
        },
        leaveLobby({ commit, state }) {
            if (state.currentLobby) {
                // In a real app, this would make an API call
                commit('setCurrentLobby', null)
            }
        },
        setPlayerReady({ commit, state }, isReady) {
            if (state.currentLobby && state.user.id) {
                commit('updatePlayerStatus', {
                    playerId: state.user.id,
                    status: isReady ? 'ready' : 'not-ready'
                })
            }
        }
    }
})