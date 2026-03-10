import { createRouter, createWebHistory } from 'vue-router'
import UVToday from '@/views/UVToday.vue'
import Awareness from '@/views/Awareness.vue'
import Protection from '@/views/Protection.vue'

const routes = [
  { path: '/', name: 'UVToday', component: UVToday },
  { path: '/awareness', name: 'Awareness', component: Awareness },
  { path: '/protection', name: 'Protection', component: Protection }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
