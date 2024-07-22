import { createRouter, createWebHistory } from 'vue-router'
import Viewer from '../views/Viewer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Viewer
    }
  ]
})

export default router
