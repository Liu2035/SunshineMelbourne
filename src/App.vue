<template>
  <PasswordGate v-if="!authenticated" @authenticated="authenticated = true" />

  <template v-else>
    <NavBar />
    <main class="page-content">
      <RouterView />
    </main>
  </template>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import PasswordGate from '@/components/PasswordGate.vue'

const authenticated = ref(sessionStorage.getItem('hsm_auth') === 'true')
</script>

<style scoped>
.page-content {
  flex: 1;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
</style>
