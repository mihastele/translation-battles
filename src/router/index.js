import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import Lobby from '../components/Lobby.vue'
import Game from '../components/Game.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/lobby',
        name: 'lobby',
        component: Lobby
    },
    {
        path: '/game/:id',
        name: 'game',
        component: Game,
        props: true
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router