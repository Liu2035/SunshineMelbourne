<template>
  <nav class="navbar sticky-top px-3 px-md-4" style="background: var(--nav-bg); min-height: 56px;">
    <RouterLink to="/" class="navbar-brand fw-bold mb-0">
      ☀️ Healthy Sunshine Melbourne
    </RouterLink>
    <ul class="nav mb-0">
      <li class="nav-item">
        <RouterLink to="/" class="nav-link nav-pill" :class="{ active: route.path === '/' }">
          UV Today
        </RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink to="/protection" class="nav-link nav-pill" :class="{ active: route.path === '/protection' }">
          Protection
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.navbar-brand {
  color: var(--nav-text);
  font-size: 1.1rem;
}

.nav-link.nav-pill {
  color: rgba(249, 246, 240, 0.7);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  transition: background var(--transition), color var(--transition);
}

.nav-link.nav-pill:hover,
.nav-link.nav-pill.active {
  color: var(--nav-text);
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.nav-pill.active {
  color: var(--nav-active);
}
</style>
