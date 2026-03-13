<template>
  <div class="gate-overlay">
    <div class="gate-card">
      <h1 class="gate-title">Healthy Sunshine Melbourne</h1>
      <p class="gate-sub">Enter the access password to continue.</p>

      <form class="gate-form" @submit.prevent="submit">
        <div class="input-wrap" :class="{ shake: shaking }">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="gate-input"
            autocomplete="current-password"
            ref="inputRef"
          />
        </div>

        <p v-if="errorMsg" class="gate-error">{{ errorMsg }}</p>

        <button type="submit" class="gate-btn" :disabled="!password">
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
.gate-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.gate-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.gate-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
}

.gate-sub {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: -0.4rem;
}

.gate-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.25rem;
}

.input-wrap.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-6px); }
  80%       { transform: translateX(6px); }
}

.gate-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  outline: none;
  background: var(--surface);
  transition: border-color 0.2s;
}

.gate-input:focus {
  border-color: var(--nav-bg);
}

.gate-error {
  font-size: 0.82rem;
  color: #e63946;
}

.gate-btn {
  padding: 0.75rem;
  background: var(--nav-bg);
  color: var(--nav-text);
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.gate-btn:disabled        { opacity: 0.4; cursor: not-allowed; }
.gate-btn:not(:disabled):hover { opacity: 0.85; }
</style>
