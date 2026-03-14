<template>
  <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
       style="background: var(--bg); z-index: 9999;">
    <div style="width: 100%; max-width: 360px;">
      <h1 class="h4 fw-bold mb-1" style="color: var(--text-primary)">Healthy Sunshine Melbourne</h1>
      <p class="text-muted small mb-4">Enter the access password to continue.</p>

      <form @submit.prevent="submit">
        <div class="mb-2" :class="{ shake: shaking }">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="form-control form-control-lg"
            autocomplete="current-password"
            ref="inputRef"
          />
        </div>

        <p v-if="errorMsg" class="text-danger small mb-2">{{ errorMsg }}</p>

        <button
          type="submit"
          class="btn w-100 fw-bold py-2"
          :disabled="!password"
          style="background: var(--nav-bg); color: var(--nav-text);"
        >
          Unlock
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const emit = defineEmits(['authenticated'])

const CORRECT_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || 'sunshine2026'

const password = ref('')
const errorMsg = ref('')
const shaking  = ref(false)
const inputRef = ref(null)

onMounted(() => nextTick(() => inputRef.value?.focus()))

function submit() {
  if (password.value === CORRECT_PASSWORD) {
    sessionStorage.setItem('hsm_auth', 'true')
    emit('authenticated')
  } else {
    errorMsg.value = 'Incorrect password. Please try again.'
    password.value = ''
    shaking.value = true
    setTimeout(() => { shaking.value = false }, 600)
    nextTick(() => inputRef.value?.focus())
  }
}
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-6px); }
  80%       { transform: translateX(6px); }
}

.shake { animation: shake 0.5s ease; }
</style>
