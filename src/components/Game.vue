<template>
  <div class="game-page">
    <div class="container py-4">
      <!-- Game header -->
      <div class="row mb-4">
        <div class="col">
          <h1 class="mb-0">
            <i class="bi bi-translate me-2"></i> Translation Battle
          </h1>
          <p class="lead mb-0">
            Translate words quickly to earn points!
          </p>
        </div>
        <div class="col-auto d-flex align-items-center">
          <button
              v-if="!gameStarted"
              class="btn btn-outline-danger"
              @click="leaveLobby"
          >
            <i class="bi bi-box-arrow-left me-1"></i> Leave Game
          </button>
          <div v-else class="game-timer">
            <i class="bi bi-clock me-1"></i>
            Round: {{ currentRound }}/{{ totalRounds }}
            <span class="ms-2 badge bg-warning">{{ formatTime(timeLeft) }}</span>
          </div>
        </div>
      </div>

      <!-- Pre-game lobby -->
      <div v-if="!gameStarted" class="game-lobby">
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="mb-0">{{ currentLobby.name }}</h3>
          </div>
          <div class="card-body">
            <div class="row mb-4">
              <div class="col-md-6">
                <h5>Game Settings</h5>
                <ul class="list-group">
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Game Mode
                    <span class="badge bg-primary">Single Word Translation</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Rounds
                    <span class="badge bg-secondary">{{ totalRounds }}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Time per Round
                    <span class="badge bg-secondary">{{ roundTime }}s</span>
                  </li>
                </ul>
              </div>
              <div class="col-md-6">
                <h5>Players ({{ currentLobby.players.length }}/{{ currentLobby.maxPlayers }})</h5>
                <ul class="list-group">
                  <li
                      v-for="player in currentLobby.players"
                      :key="player.id"
                      class="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <i
                          class="bi"
                          :class="player.id === currentLobby.host ? 'bi-person-fill' : 'bi-person'"
                      ></i>
                      {{ player.username }}
                      <span
                          v-if="player.id === currentLobby.host"
                          class="badge bg-warning ms-1"
                      >Host</span>
                    </div>
                    <span
                        class="badge"
                        :class="player.status === 'ready' ? 'bg-success' : 'bg-secondary'"
                    >
                      {{ player.status === 'ready' ? 'Ready' : 'Not Ready' }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="d-flex justify-content-center">
              <button
                  v-if="isHost"
                  class="btn btn-lg btn-success"
                  :disabled="!canStartGame"
                  @click="startGame"
              >
                <i class="bi bi-play-fill me-2"></i> Start Game
              </button>
              <button
                  v-else
                  class="btn btn-lg"
                  :class="isReady ? 'btn-outline-success' : 'btn-success'"
                  @click="toggleReady"
              >
                <i class="bi" :class="isReady ? 'bi-x-circle' : 'bi-check-circle'"></i>
                {{ isReady ? 'Cancel Ready' : 'Ready Up' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active game -->
      <div v-else class="active-game">
        <div class="row">
          <!-- Game area -->
          <div class="col-md-8">
            <div class="card mb-4">
              <div class="card-body text-center">
                <div v-if="roundActive" class="game-round">
                  <h3 class="mb-4">Translate this word:</h3>
                  <div class="word-display mb-4">
                    <h1 class="display-4">{{ currentWord.german }}</h1>
                  </div>

                  <div class="translation-input">
                    <div class="input-group mb-3">
                      <input
                          type="text"
                          class="form-control form-control-lg"
                          placeholder="Type English translation..."
                          v-model="userTranslation"
                          :disabled="hasSubmitted"
                          @keyup.enter="submitTranslation"
                          ref="translationInput"
                      >
                      <button
                          class="btn btn-primary btn-lg"
                          type="button"
                          @click="submitTranslation"
                          :disabled="hasSubmitted || !userTranslation.trim()"
                      >
                        Submit
                      </button>
                    </div>

                    <div v-if="hasSubmitted" class="submission-status mt-3">
                      <div v-if="submissionCorrect" class="alert alert-success">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        Correct! You placed #{{ submissionRank }}
                      </div>
                      <div v-else class="alert alert-danger">
                        <i class="bi bi-x-circle-fill me-2"></i>
                        Incorrect! The correct translation is: <strong>{{ currentWord.english }}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="roundEnded" class="round-results">
                  <h3 class="mb-4">Round {{ currentRound }} Results</h3>

                  <div class="word-summary mb-4">
                    <div class="row">
                      <div class="col-md-6 text-md-end">
                        <h4>{{ currentWord.german }}</h4>
                      </div>
                      <div class="col-md-6 text-md-start">
                        <h4>{{ currentWord.english }}</h4>
                      </div>
                    </div>
                  </div>

                  <div class="round-winners mb-4">
                    <h5>Round Winners:</h5>
                    <div class="row justify-content-center">
                      <div v-for="(winner, index) in roundWinners" :key="index" class="col-md-4">
                        <div class="card mb-3" :class="getWinnerCardClass(index)">
                          <div class="card-body text-center">
                            <div class="winner-place">
                              <span class="badge" :class="getWinnerBadgeClass(index)">
                                {{ index + 1 }}{{ getOrdinalSuffix(index + 1) }}
                              </span>
                            </div>
                            <h5 class="mt-2 mb-0">{{ winner.username }}</h5>
                            <div class="points-earned">
                              +{{ 3 - index }} points
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="next-round-timer">
                    <p>Next round starting in {{ nextRoundCountdown }} seconds...</p>
                    <div class="progress">
                      <div
                          class="progress-bar progress-bar-striped progress-bar-animated"
                          role="progressbar"
                          :style="{ width: `${(nextRoundCountdown / 5) * 100}%` }"
                      ></div>
                    </div>
                  </div>
                </div>

                <div v-else-if="gameEnded" class="game-results">
                  <h3 class="mb-4">Game Results</h3>

                  <div class="final-standings mb-4">
                    <h4>Final Standings</h4>
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Player</th>
                          <th>Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr
                            v-for="(player, index) in sortedPlayersByScore"
                            :key="player.id"
                            :class="{ 'table-success': player.id === user.id }"
                        >
                          <td>
                            <strong>{{ index + 1 }}</strong>
                            <span v-if="index < 3" class="ms-1">
                                <i
                                    class="bi"
                                    :class="getMedalIcon(index)"
                                ></i>
                              </span>
                          </td>
                          <td>{{ player.username }}</td>
                          <td>{{ player.score }} pts</td>
                        </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="game-actions">
                    <button class="btn btn-primary me-2" @click="playAgain">
                      <i class="bi bi-arrow-repeat me-1"></i> Play Again
                    </button>
                    <button class="btn btn-outline-secondary" @click="returnToLobby">
                      <i class="bi bi-house me-1"></i> Return to Lobby
                    </button>
                  </div>
                </div>

                <div v-else class="game-starting">
                  <h3 class="mb-4">Game Starting...</h3>
                  <div class="countdown">
                    <span class="display-1">{{ startCountdown }}</span>
                  </div>
                  <p>Get ready to translate!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Scoreboard -->
          <div class="col-md-4">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="bi bi-trophy me-2"></i> Scoreboard
                </h5>
              </div>
              <div class="card-body p-0">
                <ul class="list-group list-group-flush">
                  <li
                      v-for="player in sortedPlayersByScore"
                      :key="player.id"
                      class="list-group-item d-flex justify-content-between align-items-center"
                      :class="{ 'active': player.id === user.id }"
                  >
                    <div>
                      <span class="badge bg-secondary me-2">{{ getPlayerRank(player) }}</span>
                      {{ player.username }}
                    </div>
                    <span class="badge bg-primary">{{ player.score }} pts</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

// Props
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

// Store and router
const store = useStore()
const router = useRouter()
const route = useRoute()

// Game state
const gameStarted = ref(false)
const roundActive = ref(false)
const roundEnded = ref(false)
const gameEnded = ref(false)
const currentRound = ref(0)
const totalRounds = ref(10)
const roundTime = ref(20) // seconds per round
const timeLeft = ref(0)
const startCountdown = ref(3)
const nextRoundCountdown = ref(5)
const userTranslation = ref('')
const hasSubmitted = ref(false)
const submissionCorrect = ref(false)
const submissionRank = ref(0)
const currentWord = ref({
  german: '',
  english: ''
})
const roundWinners = ref([])
const players = ref([])
const timerInterval = ref(null)
const translationInput = ref(null)

// Mock word database - in a real app, this would come from the server
const wordDatabase = [
  { german: 'Haus', english: 'house' },
  { german: 'Auto', english: 'car' },
  { german: 'Baum', english: 'tree' },
  { german: 'Hund', english: 'dog' },
  { german: 'Katze', english: 'cat' },
  { german: 'Buch', english: 'book' },
  { german: 'Tisch', english: 'table' },
  { german: 'Stuhl', english: 'chair' },
  { german: 'Fenster', english: 'window' },
  { german: 'Tür', english: 'door' },
  { german: 'Wasser', english: 'water' },
  { german: 'Brot', english: 'bread' },
  { german: 'Apfel', english: 'apple' },
  { german: 'Milch', english: 'milk' },
  { german: 'Schule', english: 'school' }
]

// Used words to avoid repetition
const usedWordIndices = ref([])

// Computed properties
const user = computed(() => store.state.user)
const currentLobby = computed(() => store.state.currentLobby)

const isHost = computed(() => {
  return currentLobby.value && user.value.id === currentLobby.value.host
})

const isReady = computed(() => {
  if (!currentLobby.value) return false
  const currentPlayer = currentLobby.value.players.find(p => p.id === user.value.id)
  return currentPlayer && currentPlayer.status === 'ready'
})

const canStartGame = computed(() => {
  if (!currentLobby.value || currentLobby.value.players.length < 2) return false
  return currentLobby.value.players.every(player => player.status === 'ready')
})

const sortedPlayersByScore = computed(() => {
  return [...players.value].sort((a, b) => b.score - a.score)
})

// Methods
const leaveLobby = async () => {
  await store.dispatch('leaveLobby')
  router.push('/')
}

const toggleReady = async () => {
  await store.dispatch('setPlayerReady', !isReady.value)
}

const startGame = () => {
  // Initialize player scores
  players.value = currentLobby.value.players.map(player => ({
    ...player,
    score: 0,
    currentSubmission: null,
    submissionTime: null
  }))

  // Start the game countdown
  gameStarted.value = true
  startGameCountdown()
}

const startGameCountdown = () => {
  const countdownInterval = setInterval(() => {
    startCountdown.value--

    if (startCountdown.value <= 0) {
      clearInterval(countdownInterval)
      startRound()
    }
  }, 1000)
}

const startRound = () => {
  // Reset round state
  currentRound.value++
  roundActive.value = true
  roundEnded.value = false
  hasSubmitted.value = false
  submissionCorrect.value = false
  submissionRank.value = 0
  userTranslation.value = ''
  roundWinners.value = []

  // Reset player submissions for this round
  players.value.forEach(player => {
    player.currentSubmission = null
    player.submissionTime = null
  })

  // Select a random word that hasn't been used yet
  selectRandomWord()

  // Start the round timer
  timeLeft.value = roundTime.value
  timerInterval.value = setInterval(() => {
    timeLeft.value--

    if (timeLeft.value <= 0) {
      clearInterval(timerInterval.value)
      endRound()
    }
  }, 1000)

  // Focus the input field
  nextTick(() => {
    if (translationInput.value) {
      translationInput.value.focus()
    }
  })
}

const selectRandomWord = () => {
  // If we've used all words, reset the used words array
  if (usedWordIndices.value.length >= wordDatabase.length) {
    usedWordIndices.value = []
  }

  // Find an unused word
  let randomIndex
  do {
    randomIndex = Math.floor(Math.random() * wordDatabase.length)
  } while (usedWordIndices.value.includes(randomIndex))

  // Mark this word as used
  usedWordIndices.value.push(randomIndex)

  // Set the current word
  currentWord.value = wordDatabase[randomIndex]
}

const submitTranslation = () => {
  if (!roundActive.value || hasSubmitted.value || !userTranslation.value.trim()) return

  hasSubmitted.value = true

  // Find the current player
  const currentPlayer = players.value.find(p => p.id === user.value.id)
  if (!currentPlayer) return

  // Record the submission
  currentPlayer.currentSubmission = userTranslation.value.trim().toLowerCase()
  currentPlayer.submissionTime = roundTime.value - timeLeft.value

  // Check if correct
  submissionCorrect.value = currentPlayer.currentSubmission === currentWord.value.english.toLowerCase()

  if (submissionCorrect.value) {
    // Calculate rank (how many players submitted correct answers before this player)
    const correctSubmissions = players.value.filter(p =>
        p.currentSubmission === currentWord.value.english.toLowerCase()
    ).sort((a, b) => a.submissionTime - b.submissionTime)

    submissionRank.value = correctSubmissions.findIndex(p => p.id === currentPlayer.id) + 1

    // Award points based on rank (3 for 1st, 2 for 2nd, 1 for 3rd)
    if (submissionRank.value <= 3) {
      currentPlayer.score += (4 - submissionRank.value)
    }
  }

  // Check if all players have submitted or time is up
  const allSubmitted = players.value.every(p => p.currentSubmission !== null)
  if (allSubmitted) {
    clearInterval(timerInterval.value)
    endRound()
  }
}

const endRound = () => {
  roundActive.value = false
  roundEnded.value = true

  // Determine round winners (top 3 correct submissions by time)
  const correctSubmissions = players.value
      .filter(p => p.currentSubmission === currentWord.value.english.toLowerCase())
      .sort((a, b) => a.submissionTime - b.submissionTime)
      .slice(0, 3)

  roundWinners.value = correctSubmissions

  // Start countdown to next round
  nextRoundCountdown.value = 5
  const nextRoundInterval = setInterval(() => {
    nextRoundCountdown.value--

    if (nextRoundCountdown.value <= 0) {
      clearInterval(nextRoundInterval)

      if (currentRound.value >= totalRounds.value) {
        endGame()
      } else {
        startRound()
      }
    }
  }, 1000)
}

const endGame = () => {
  roundEnded.value = false
  gameEnded.value = true
}

const playAgain = () => {
  // Reset game state
  gameStarted.value = false
  roundActive.value = false
  roundEnded.value = false
  gameEnded.value = false
  currentRound.value = 0
  startCountdown.value = 3
  usedWordIndices.value = []

  // Start a new game
  startGame()
}

const returnToLobby = () => {
  router.push('/')
}

const formatTime = (seconds) => {
  return `${seconds}s`
}

const getPlayerRank = (player) => {
  const rank = sortedPlayersByScore.value.findIndex(p => p.id === player.id) + 1
  return rank
}

const getWinnerCardClass = (index) => {
  const classes = ['border']
  if (index === 0) classes.push('border-warning')
  else if (index === 1) classes.push('border-secondary')
  else if (index === 2) classes.push('border-danger')
  return classes.join(' ')
}

const getWinnerBadgeClass = (index) => {
  if (index === 0) return 'bg-warning text-dark'
  else if (index === 1) return 'bg-secondary'
  else if (index === 2) return 'bg-danger'
  return 'bg-primary'
}

const getMedalIcon = (index) => {
  if (index === 0) return 'bi-trophy-fill text-warning'
  else if (index === 1) return 'bi-trophy-fill text-secondary'
  else if (index === 2) return 'bi-trophy-fill text-danger'
  return ''
}

const getOrdinalSuffix = (num) => {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

// Lifecycle hooks
onMounted(async () => {
  // In a real app, we would fetch the lobby data from the server
  if (!currentLobby.value) {
    // Mock joining a lobby if not already in one
    await store.dispatch('joinLobby', props.id)
  }
})

onBeforeUnmount(() => {
  // Clear any active intervals
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Watch for changes in the lobby
watch(() => currentLobby.value, (newLobby) => {
  if (!newLobby) {
    // If the lobby was closed, return to home
    router.push('/')
  }
})
</script>