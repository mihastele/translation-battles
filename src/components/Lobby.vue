<template>
  <div class="lobby-page">
    <div class="container py-4">
      <div class="row mb-4">
        <div class="col">
          <h1 class="mb-0">
            <i class="bi bi-people-fill me-2"></i> Find a Match
          </h1>
        </div>
        <div class="col-auto">
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <button class="btn btn-primary ms-2" @click="refreshLobbies">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      <!-- Filter options -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>
            <input
                type="text"
                class="form-control"
                placeholder="Search lobbies..."
                v-model="searchQuery"
            >
          </div>
        </div>
        <div class="col-md-6">
          <div class="btn-group w-100">
            <button
                class="btn"
                :class="filter === 'all' ? 'btn-primary' : 'btn-outline-primary'"
                @click="filter = 'all'"
            >
              All
            </button>
            <button
                class="btn"
                :class="filter === 'single-word' ? 'btn-primary' : 'btn-outline-primary'"
                @click="filter = 'single-word'"
            >
              Single Word
            </button>
            <button
                class="btn"
                :class="filter === 'fill-blank' ? 'btn-primary' : 'btn-outline-primary'"
                @click="filter = 'fill-blank'"
            >
              Fill in Blank
            </button>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading available lobbies...</p>
      </div>

      <!-- No lobbies found -->
      <div v-else-if="filteredLobbies.length === 0" class="text-center py-5">
        <i class="bi bi-emoji-frown display-1 text-muted"></i>
        <h3 class="mt-3">No lobbies found</h3>
        <p class="text-muted">Try refreshing or create your own match!</p>
        <button class="btn btn-primary mt-3" @click="goBack">
          Create a Match
        </button>
      </div>

      <!-- Lobbies list -->
      <div v-else class="row">
        <div
            v-for="lobby in filteredLobbies"
            :key="lobby.id"
            class="col-md-6 col-lg-4 mb-4"
        >
          <div class="card h-100 lobby-card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">{{ lobby.name }}</h5>
              <span class="badge" :class="getStatusBadgeClass(lobby.status)">
                {{ formatStatus(lobby.status) }}
              </span>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <span class="badge bg-info me-2">
                  {{ lobby.gameMode === 'single-word' ? 'Single Word' : 'Fill in Blank' }}
                </span>
                <span class="badge bg-secondary">
                  <i class="bi bi-people-fill me-1"></i>
                  {{ lobby.players.length }} / {{ lobby.maxPlayers }}
                </span>
              </div>

              <div class="players-list mb-3">
                <div class="d-flex align-items-center mb-2">
                  <i class="bi bi-person-circle me-2"></i>
                  <span>{{ getHostName(lobby) }}</span>
                  <span class="badge bg-warning ms-2">Host</span>
                </div>
                <div
                    v-for="player in getNonHostPlayers(lobby)"
                    :key="player.id"
                    class="d-flex align-items-center mb-2"
                >
                  <i class="bi bi-person me-2"></i>
                  <span>{{ player.username }}</span>
                  <span
                      class="badge ms-2"
                      :class="player.status === 'ready' ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ player.status === 'ready' ? 'Ready' : 'Not Ready' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button
                  class="btn btn-primary w-100"
                  @click="handleJoinLobby(lobby.id)"
                  :disabled="lobby.status !== 'waiting' || lobby.players.length >= lobby.maxPlayers"
              >
                <i class="bi bi-box-arrow-in-right me-2"></i>
                Join Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'LobbyView',
  data() {
    return {
      loading: true,
      searchQuery: '',
      filter: 'all',
      refreshInterval: null
    }
  },
  computed: {
    ...mapState(['activeLobbies', 'user']),

    filteredLobbies() {
      let result = this.activeLobbies

      // Apply search filter
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase()
        result = result.filter(lobby =>
            lobby.name.toLowerCase().includes(query) ||
            lobby.players.some(player => player.username.toLowerCase().includes(query))
        )
      }

      // Apply game mode filter
      if (this.filter !== 'all') {
        result = result.filter(lobby => lobby.gameMode === this.filter)
      }

      return result
    }
  },
  async created() {
    await this.loadLobbies()

    // Set up auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.refreshLobbies()
    }, 10000)
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },
  methods: {
    ...mapActions(['fetchLobbies', 'joinLobby']),

    async loadLobbies() {
      this.loading = true
      await this.fetchLobbies()
      this.loading = false
    },

    async refreshLobbies() {
      await this.fetchLobbies()
    },

    goBack() {
      this.$router.push('/')
    },

    async handleJoinLobby(lobbyId) {
      const result = await this.joinLobby(lobbyId)
      if (result) {
        this.$router.push(`/game/${lobbyId}`)
      }
    },

    getHostName(lobby) {
      const host = lobby.players.find(player => player.id === lobby.host)
      return host ? host.username : 'Unknown Host'
    },

    getNonHostPlayers(lobby) {
      return lobby.players.filter(player => player.id !== lobby.host)
    },

    getStatusBadgeClass(status) {
      switch (status) {
        case 'waiting': return 'bg-success'
        case 'in-progress': return 'bg-warning'
        case 'finished': return 'bg-secondary'
        default: return 'bg-secondary'
      }
    },

    formatStatus(status) {
      switch (status) {
        case 'waiting': return 'Waiting for Players'
        case 'in-progress': return 'Game in Progress'
        case 'finished': return 'Game Finished'
        default: return status
      }
    }
  }
}
</script>

<style scoped>
.lobby-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 2rem;
}

.lobby-card {
  transition: transform 0.2s;
  border: 1px solid rgba(0,0,0,0.125);
}

.lobby-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.players-list {
  max-height: 150px;
  overflow-y: auto;
}
</style>