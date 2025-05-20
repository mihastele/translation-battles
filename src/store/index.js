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
            if (lobby) {
                // Ensure players array exists
                if (!lobby.players) {
                    lobby.players = [];
                }
                // Ensure all players have required fields
                lobby.players = lobby.players.map(p => ({
                    id: p.id || '',
                    username: p.username || 'Unknown',
                    status: p.status || 'not-ready',
                    isHost: p.isHost || false,
                    score: typeof p.score === 'number' ? p.score : 0
                }));
            }
            state.currentLobby = lobby;
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
            if (!state.currentLobby) return;
            
            // Initialize players array if it doesn't exist
            if (!state.currentLobby.players) {
                state.currentLobby.players = [];
            }
            
            // Find the player or create a new one if not found
            let player = state.currentLobby.players.find(p => p && p.id === playerId);
            
            if (player) {
                // Update existing player
                player.status = status;
            } else {
                // Add new player (this should be handled by joinLobby, but just in case)
                state.currentLobby.players.push({
                    id: playerId,
                    status: status,
                    score: 0
                });
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
        async fetchLobbies({ commit }) {
            const baseUrl = ''; // Using Vite proxy
            try {
                const response = await fetch(`${baseUrl}/lobbies`);
                if (!response.ok) throw new Error('Failed to fetch lobbies');
                const data = await response.json();
                commit('setActiveLobbies', data);
                return data;
            } catch (err) {
                console.error('Failed to fetch lobbies:', err);
                throw err;
            }
        },
        async createLobby({ commit, state }, lobbyData) {
            const baseUrl = ''; // Using Vite proxy
            try {
                const response = await fetch(`${baseUrl}/lobbies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: lobbyData.name,
                        host: state.user.id,
                        username: state.user.username,
                        gameMode: lobbyData.gameMode,
                        maxPlayers: lobbyData.maxPlayers
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to create lobby');
                }

                const newLobby = await response.json();
                
                // Ensure the current user is in the players list
                if (!newLobby.players) newLobby.players = [];
                if (!newLobby.players.some(p => p && p.id === state.user.id)) {
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
            } catch (err) {
                console.error('Failed to create lobby:', err);
                throw err;
            }
        },
        async joinLobby({ commit, state, dispatch }, lobbyId) {
            try {
                console.log(`[Store] Attempting to join lobby ${lobbyId}...`);
                
                if (!state.user?.id) {
                    throw new Error('User must be logged in to join a lobby');
                }

                // Base URL for API requests (using Vite proxy)
                const baseUrl = ''; // Proxy will handle the base URL
                
                // First, fetch all lobbies to see if the requested one exists
                const lobbiesResponse = await fetch(`${baseUrl}/lobbies`);
                if (!lobbiesResponse.ok) {
                    throw new Error('Failed to fetch lobbies');
                }
                
                const lobbies = await lobbiesResponse.json();
                const lobbyExists = lobbies.some(lobby => lobby && lobby.id === lobbyId);
                
                if (!lobbyExists) {
                    throw new Error('Lobby not found. It may have been closed or never existed.');
                }
                
                console.log(`[Store] Lobby ${lobbyId} exists, attempting to join...`);
                
                const response = await fetch(`${baseUrl}/lobbies/${lobbyId}/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: state.user.id,
                        username: state.user.username
                    })
                });
                
                if (!response.ok) {
                    let errorMessage = 'Failed to join lobby';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        // If we can't parse the error, use the status text
                        errorMessage = response.status === 404 ? 'Lobby not found' : response.statusText;
                    }
                    throw new Error(errorMessage);
                }
                
                const lobby = await response.json();
                console.log('[Store] Successfully joined lobby:', lobby);
                
                // Ensure the lobby has a players array
                if (!lobby.players) {
                    lobby.players = [];
                }
                
                // Ensure the current user is in the players list
                const userInLobby = lobby.players.some(p => p && p.id === state.user.id);
                if (!userInLobby) {
                    lobby.players.push({
                        id: state.user.id,
                        username: state.user.username,
                        status: 'not-ready',
                        isHost: false,
                        score: 0
                    });
                }
                
                commit('setCurrentLobby', lobby);
                return lobby;
                
            } catch (err) {
                console.error('[Store] Failed to join lobby:', err);
                // Enhance the error message for better user feedback
                if (err.message.includes('Failed to fetch')) {
                    err.message = 'Could not connect to the server. Please check your connection.';
                } else if (err.message.includes('404') || err.message.toLowerCase().includes('not found')) {
                    err.message = 'The lobby was not found. It may have been closed or never existed.';
                }
                throw err;
            }
        },
        async leaveLobby({ commit, state }) {
            if (!state.currentLobby || !state.user?.id) return;
            
            const baseUrl = ''; // Using Vite proxy
            const lobbyId = state.currentLobby.id;
            const userId = state.user.id;
            
            try {
                // First update local state
                commit('setCurrentLobby', null);
                
                // Then notify server
                const response = await fetch(
                    `${baseUrl}/lobbies/${lobbyId}/leave`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    }
                );
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to leave lobby');
                }
                
                commit('setCurrentLobby', null);
                return await response.json();
                
            } catch (err) {
                console.error('Failed to leave lobby:', err);
                throw err;
            }
        },
        async setPlayerReady({ commit, state, dispatch }, isReady) {
            if (!state.currentLobby || !state.user.id) {
                throw new Error('No active lobby or user');
            }
            
            const baseUrl = ''; // Using Vite proxy
            const status = isReady ? 'ready' : 'not-ready';
            
            try {
                // Update local state immediately for better UX
                commit('updatePlayerStatus', { playerId: state.user.id, status });
                
                // Then sync with server - using the /ready endpoint
                const response = await fetch(
                    `${baseUrl}/lobbies/${state.currentLobby.id}/ready`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            userId: state.user.id,
                            status: status
                        })
                    }
                );
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to update status');
                }
                
                const updatedLobby = await response.json();
                commit('setCurrentLobby', updatedLobby);
                return updatedLobby;
                
            } catch (err) {
                console.error('Error updating player status:', err);
                // Revert the local state if server update fails
                commit('updatePlayerStatus', { 
                    playerId: state.user.id, 
                    status: isReady ? 'not-ready' : 'ready' 
                });
                throw err;
            }    
        }
    }
})