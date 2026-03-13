import { createRouter, createWebHistory } from 'vue-router'
import UVToday from '@/views/UVToday.vue'
import Protection from '@/views/Protection.vue'

const routes = [
  { path: '/', name: 'UVToday', component: UVToday },
  { path: '/protection', name: 'Protection', component: Protection }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
