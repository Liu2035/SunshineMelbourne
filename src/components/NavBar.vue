<template>
  <nav class="navbar">
    <RouterLink to="/" class="brand">☀️ SunSmart</RouterLink>
    <ul class="nav-links">
      <li><RouterLink to="/" :class="{ active: route.path === '/' }">UV Today</RouterLink></li>
      <li><RouterLink to="/awareness" :class="{ active: route.path === '/awareness' }">Awareness</RouterLink></li>
      <li><RouterLink to="/protection" :class="{ active: route.path === '/protection' }">Protection</RouterLink></li>
    </ul>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.navbar {
  background: var(--nav-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  color: var(--nav-text);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: 0.01em;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 0.25rem;
}

.nav-links a {
  color: rgba(249, 246, 240, 0.7);
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background var(--transition), color var(--transition);
}

.nav-links a:hover,
.nav-links a.active {
  color: var(--nav-text);
  background: rgba(255, 255, 255, 0.1);
}

.nav-links a.active {
  color: var(--nav-active);
}

@media (max-width: 480px) {
  .brand span {
    display: none;
  }
  .nav-links a {
    padding: 0.4rem 0.6rem;
    font-size: 0.82rem;
  }
}
</style>
