import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Import Bootstrap Icons CSS
import 'bootstrap-icons/font/bootstrap-icons.css'

// Create the Vue application
const app = createApp(App)

// Use plugins
app.use(store)
app.use(router)

// Mount the app
app.mount('#app')

// Global error handler
app.config.errorHandler = (err, vm, info) => {
    console.error('Vue Error:', err)
    console.error('Error Info:', info)
}

// Custom directive for auto-focus
app.directive('focus', {
    mounted(el) {
        el.focus()
    }
})