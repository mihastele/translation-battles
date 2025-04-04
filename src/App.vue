<template>
  <div id="app">
    <!-- Navigation bar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <router-link class="navbar-brand" to="/">
          <i class="bi bi-translate me-2"></i>
          Translation Battle
        </router-link>

        <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/lobby">Find Games</router-link>
            </li>
          </ul>

          <div class="d-flex align-items-center">
            <div v-if="isAuthenticated" class="text-light me-3">
              <i class="bi bi-person-circle me-1"></i>
              {{ user.username }}
            </div>
            <button
                v-if="isAuthenticated"
                class="btn btn-outline-light btn-sm"
                @click="logout"
            >
              <i class="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content area -->
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 bg-light">
      <div class="container text-center">
        <span class="text-muted">
          Translation Battle Game &copy; {{ currentYear }}
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

// Store and router
const store = useStore()
const router = useRouter()

// Computed properties
const user = computed(() => store.state.user)
const isAuthenticated = computed(() => store.getters.isAuthenticated)
const currentYear = computed(() => new Date().getFullYear())

// Methods
const logout = async () => {
  // Clear user data
  await store.commit('setUser', {
    id: null,
    username: '',
    isAuthenticated: false
  })

  // Navigate to home
  router.push('/')
}
</script>

<style>
/* Global styles */
body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Page transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Utility classes */
.cursor-pointer {
  cursor: pointer;
}

/* Game-specific styles */
.word-display {
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.game-timer {
  font-size: 1.25rem;
  font-weight: 500;
}

.countdown {
  font-size: 5rem;
  font-weight: 700;
  color: #007bff;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>