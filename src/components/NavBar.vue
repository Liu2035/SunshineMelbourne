<template>
  <nav class="navbar sticky-top px-3 px-md-4" style="background: var(--nav-bg); min-height: 58px; box-shadow: 0 2px 10px rgba(0,0,0,0.15);">
    <div class="container-fluid max-w-nav px-0 d-flex align-items-center justify-content-between">
      <RouterLink to="/" class="navbar-brand fw-bold mb-0 d-flex align-items-center gap-2">
        <span class="brand-icon">☀️</span>
        <span class="brand-text">Healthy Sunshine Melbourne</span>
      </RouterLink>
      <ul class="nav mb-0 d-flex gap-1">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link nav-pill" :class="{ active: route.path === '/' }">
            UV Today
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/awareness" class="nav-link nav-pill" :class="{ active: route.path === '/awareness' }">
            Awareness
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/protection" class="nav-link nav-pill" :class="{ active: route.path === '/protection' }">
            Protection
          </RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.max-w-nav {
  max-width: 960px;
  margin: 0 auto;
}

.brand-icon {
  font-size: 1.25rem;
}

.brand-text {
  color: var(--nav-text);
  font-size: 1.05rem;
  letter-spacing: -0.2px;
}

.nav-link.nav-pill {
  color: rgba(249, 246, 240, 0.75);
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  transition: background var(--transition), color var(--transition);
}

.nav-link.nav-pill:hover {
  color: var(--nav-text);
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.nav-pill.active {
  color: #ffffff;
  background: var(--color-high);
}

@media (max-width: 576px) {
  .brand-text {
    font-size: 0.92rem;
  }
  .nav-link.nav-pill {
    font-size: 0.78rem;
    padding: 0.35rem 0.5rem;
  }
}
</style>
