<template>
  <div class="home">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <h1 class="display-4 mb-4">Translation Battle</h1>
          <p class="lead mb-5">
            Test your language skills in a multiplayer translation competition!
          </p>

          <div v-if="!isAuthenticated" class="login-form mb-4">
            <div class="input-group mb-3">
              <input
                  type="text"
                  class="form-control"
                  v-model="username"
                  placeholder="Enter your username"
                  @keyup.enter="login"
              >
              <button
                  class="btn btn-primary"
                  type="button"
                  @click="login"
                  :disabled="!username.trim()"
              >
                <i class="bi bi-box-arrow-in-right"></i> Login
              </button>
            </div>
          </div>

          <div v-else class="game-options">
            <h3 class="mb-3">Welcome, {{ user.username }}!</h3>
            <div class="d-grid gap-3">
              <button
                  class="btn btn-primary btn-lg"
                  @click="findMatch"
              >
                <i class="bi bi-search"></i> Find Match
              </button>
              <button
                  class="btn btn-success btn-lg"
                  @click="createMatch"
              >
                <i class="bi bi-plus-circle"></i> Create Match
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Match Modal -->
    <div class="modal fade" id="createMatchModal" tabindex="-1" aria-hidden="true" ref="createModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Match</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="lobbyName" class="form-label">Lobby Name</label>
              <input type="text" class="form-control" id="lobbyName" v-model="newLobby.name">
            </div>
            <div class="mb-3">
              <label class="form-label">Game Mode</label>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="gameMode" id="singleWord" value="single-word" v-model="newLobby.gameMode">
                <label class="form-check-label" for="singleWord">
                  Single Word Translation
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="gameMode" id="fillBlank" value="fill-blank" v-model="newLobby.gameMode">
                <label class="form-check-label" for="fillBlank">
                  Fill in the Blank
                </label>
              </div>
            </div>
            <div class="mb-3">
              <label for="maxPlayers" class="form-label">Max Players</label>
              <select class="form-select" id="maxPlayers" v-model="newLobby.maxPlayers">
                <option value="2">2 Players</option>
                <option value="3">3 Players</option>
                <option value="4">4 Players</option>
                <option value="6">6 Players</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="confirmCreateMatch" :disabled="!newLobby.name">Create</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap'
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'HomeView',
  data() {
    return {
      username: '',
      createModal: null,
      newLobby: {
        name: '',
        gameMode: 'single-word',
        maxPlayers: 4
      }
    }
  },
  computed: {
    ...mapState(['user']),
    ...mapGetters(['isAuthenticated'])
  },
  mounted() {
    this.$nextTick(() => {
      this.createModal = new Modal(this.$refs.createModal)
    })
  },
  methods: {
    ...mapActions(['login', 'createLobby', 'fetchLobbies']),

    async handleLogin() {
      if (this.username.trim()) {
        await this.login(this.username)
      }
    },

    findMatch() {
      this.$router.push('/lobby')
    },

    createMatch() {
      this.createModal.show()
    },

    async confirmCreateMatch() {
      const lobby = await this.createLobby(this.newLobby)
      this.createModal.hide()
      this.$router.push(`/game/${lobby.id}`)

      // Reset form
      this.newLobby = {
        name: '',
        gameMode: 'single-word',
        maxPlayers: 4
      }
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
}

.game-options {
  max-width: 400px;
  margin: 0 auto;
}
</style>