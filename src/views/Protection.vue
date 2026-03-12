<template>
  <div class="protection">

    <!-- ── Dosage Calculator ─────────────────────────────────────── -->
    <section class="card">
      <h2 class="card-title">🧴 Sunscreen Dosage Calculator</h2>
      <p class="card-sub">
        Enter today's UV index and choose what you're covering — we'll tell you exactly how much to apply.
      </p>

      <!-- UV index input -->
      <div class="field">
        <label class="field-label">UV Index</label>
        <div class="uv-input-row">
          <input
            v-model.number="uvInput"
            type="range"
            min="0"
            max="13"
            step="1"
            class="uv-slider"
            :style="{ accentColor: uvInfo.color }"
          />
          <div class="uv-badge" :style="{ background: uvInfo.color }">
            {{ uvInput }}
          </div>
        </div>
        <div class="uv-level-label" :style="{ color: uvInfo.color }">{{ uvInfo.label }}</div>
      </div>

      <!-- Coverage area selector -->
      <div class="field">
        <label class="field-label">Coverage Area</label>
        <div class="coverage-options">
          <button
            v-for="opt in coverageOptions"
            :key="opt.id"
            class="coverage-btn"
            :class="{ selected: selectedCoverage === opt.id }"
            @click="selectedCoverage = opt.id"
          >
            <span class="coverage-icon">{{ opt.icon }}</span>
            <span class="coverage-name">{{ opt.name }}</span>
          </button>
        </div>
      </div>

      <!-- Result -->
      <div class="result-box" :style="{ borderColor: uvInfo.color }">
        <div class="result-row">
          <div class="result-item">
            <div class="result-value">{{ dosage.spf }}</div>
            <div class="result-key">Recommended SPF</div>
          </div>
          <div class="result-divider"></div>
          <div class="result-item">
            <div class="result-value">{{ dosage.teaspoons }} tsp</div>
            <div class="result-key">Amount to apply</div>
          </div>
          <div class="result-divider"></div>
          <div class="result-item">
            <div class="result-value">≈ {{ dosage.pumps }} pumps</div>
            <div class="result-key">Pump equivalent</div>
          </div>
        </div>
        <p class="result-note">{{ dosage.note }}</p>
        <button class="set-reminder-btn" @click="setReminderFromCalculator">
          ⏱ Set Reapplication Reminder ({{ dosage.intervalLabel }})
        </button>
      </div>

      <p class="dosage-standard">
        Based on the Cancer Council Australia teaspoon rule and the clinical standard of 2 mg/cm².
      </p>
    </section>

    <!-- ── Reapplication Reminder ────────────────────────────────── -->
    <section class="card" ref="reminderSection">
      <h2 class="card-title">⏱ Reapplication Reminder</h2>
      <p class="card-sub">
        Set a timer to remind yourself when it's time to reapply sunscreen.
      </p>

      <!-- Interval selector -->
      <div class="field">
        <label class="field-label">Remind me every</label>
        <div class="interval-options">
          <button
            v-for="opt in intervalOptions"
            :key="opt.seconds"
            class="interval-btn"
            :class="{ selected: selectedInterval === opt.seconds }"
            :disabled="timerRunning"
            @click="selectedInterval = opt.seconds"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Countdown display -->
      <div class="timer-wrap">
        <svg class="timer-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" class="ring-bg" />
          <circle
            cx="60" cy="60" r="52"
            class="ring-progress"
            :stroke="timerFinished ? '#e63946' : '#f77f00'"
            :stroke-dasharray="ringCircumference"
            :stroke-dashoffset="ringOffset"
          />
        </svg>
        <div class="timer-inner">
          <div class="timer-display" :class="{ finished: timerFinished }">
            {{ formattedTime }}
          </div>
          <div class="timer-label">{{ timerStatusLabel }}</div>
        </div>
      </div>

      <!-- Alert when finished -->
      <div v-if="timerFinished" class="timer-alert">
        <span class="alert-icon">☀️</span>
        <div>
          <div class="alert-title">Time to reapply sunscreen!</div>
          <div class="alert-body">Apply {{ currentDosageSummary }} to all exposed skin before going back out.</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        <button
          v-if="!timerRunning && !timerFinished"
          class="ctrl-btn start-btn"
          @click="startTimer"
        >
          ▶ Start
        </button>
        <button
          v-if="timerRunning"
          class="ctrl-btn pause-btn"
          @click="pauseTimer"
        >
          ⏸ Pause
        </button>
        <button
          v-if="timerFinished || timerRunning || remaining < selectedInterval"
          class="ctrl-btn reset-btn"
          @click="resetTimer"
        >
          ↺ Reset
        </button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// ── UV level helpers ──────────────────────────────────────────────
const uvInput = ref(6)

const UV_BANDS = [
  { max: 2,  label: 'Low',       color: '#4caf50', spf: 'SPF 30',  interval: 7200 },
  { max: 5,  label: 'Moderate',  color: '#f9c74f', spf: 'SPF 30+', interval: 7200 },
  { max: 7,  label: 'High',      color: '#f77f00', spf: 'SPF 50+', interval: 5400 },
  { max: 10, label: 'Very High', color: '#e63946', spf: 'SPF 50+', interval: 5400 },
  { max: 99, label: 'Extreme',   color: '#7b2d8b', spf: 'SPF 50+', interval: 5400 },
]

const uvInfo = computed(() => UV_BANDS.find(b => uvInput.value <= b.max))

// ── Coverage options ──────────────────────────────────────────────
const coverageOptions = [
  { id: 'face',     icon: '😊', name: 'Face & Neck',         teaspoons: 1, pumps: 5  },
  { id: 'arms',     icon: '💪', name: 'Face, Neck & Arms',   teaspoons: 3, pumps: 15 },
  { id: 'fullbody', icon: '🧍', name: 'Full Body',           teaspoons: 7, pumps: 35 },
]
const selectedCoverage = ref('arms')

const INTERVAL_NOTES = {
  7200: 'every 2 hours',
  5400: 'every 90 minutes',
}

const dosage = computed(() => {
  const band    = uvInfo.value
  const area    = coverageOptions.find(c => c.id === selectedCoverage.value)
  const intSecs = band.interval
  const intLbl  = intSecs === 7200 ? '2 hours' : '90 min'
  return {
    spf:           band.spf,
    teaspoons:     area.teaspoons,
    pumps:         area.pumps,
    intervalLabel: intLbl,
    note: `Reapply ${INTERVAL_NOTES[intSecs]} or after swimming/sweating. Apply 20 minutes before going outside.`,
  }
})

const currentDosageSummary = computed(() =>
  `${dosage.value.teaspoons} teaspoon${dosage.value.teaspoons > 1 ? 's' : ''} (≈ ${dosage.value.pumps} pumps) of ${dosage.value.spf}`
)

// ── Reminder / timer ──────────────────────────────────────────────
const intervalOptions = [
  { label: '90 minutes', seconds: 5400 },
  { label: '2 hours',    seconds: 7200 },
]
const selectedInterval = ref(7200)
const remaining        = ref(7200)
const timerRunning     = ref(false)
const timerFinished    = ref(false)
const reminderSection  = ref(null)

let _interval = null

const formattedTime = computed(() => {
  const t = remaining.value
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const timerStatusLabel = computed(() => {
  if (timerFinished.value) return 'Reapply now!'
  if (timerRunning.value)  return 'until next application'
  if (remaining.value < selectedInterval.value) return 'paused'
  return 'ready'
})

// SVG ring progress
const ringCircumference = 2 * Math.PI * 52   // ≈ 326.7
const ringOffset = computed(() => {
  const progress = remaining.value / selectedInterval.value
  return ringCircumference * (1 - progress)
})

function startTimer() {
  timerFinished.value = false
  timerRunning.value  = true
  _interval = setInterval(() => {
    if (remaining.value <= 1) {
      remaining.value   = 0
      timerRunning.value = false
      timerFinished.value = true
      clearInterval(_interval)
    } else {
      remaining.value -= 1
    }
  }, 1000)
}

function pauseTimer() {
  timerRunning.value = false
  clearInterval(_interval)
}

function resetTimer() {
  clearInterval(_interval)
  timerRunning.value  = false
  timerFinished.value = false
  remaining.value     = selectedInterval.value
}

function setReminderFromCalculator() {
  const intSecs = uvInfo.value.interval
  selectedInterval.value = intSecs
  resetTimer()
  reminderSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onUnmounted(() => clearInterval(_interval))
</script>

<style scoped>
.protection {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Card */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
}

.card-sub {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: -0.75rem;
}

/* Field */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* UV slider */
.uv-input-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.uv-slider {
  flex: 1;
  height: 6px;
  cursor: pointer;
}

.uv-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  transition: background 0.2s;
}

.uv-level-label {
  font-size: 0.82rem;
  font-weight: 700;
  transition: color 0.2s;
}

/* Coverage options */
.coverage-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.coverage-btn {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.85rem 0.5rem;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  transition: border-color 0.2s, background 0.2s;
  cursor: pointer;
}

.coverage-btn.selected {
  border-color: var(--color-high);
  background: #fff4ec;
}

.coverage-icon { font-size: 1.5rem; }
.coverage-name { font-size: 0.8rem; font-weight: 600; text-align: center; }

/* Result box */
.result-box {
  border: 2px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: border-color 0.2s;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-item {
  flex: 1;
  text-align: center;
}

.result-value {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.2;
}

.result-key {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.result-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
  flex-shrink: 0;
}

.result-note {
  font-size: 0.82rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.5;
}

.set-reminder-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-high);
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 10px;
  transition: opacity 0.2s;
}

.set-reminder-btn:hover { opacity: 0.85; }

.dosage-standard {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

/* Interval selector */
.interval-options {
  display: flex;
  gap: 0.5rem;
}

.interval-btn {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  font-weight: 600;
  font-size: 0.88rem;
  transition: border-color 0.2s, background 0.2s;
  cursor: pointer;
}

.interval-btn.selected {
  border-color: var(--color-high);
  background: #fff4ec;
}

.interval-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Timer */
.timer-wrap {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto;
}

.timer-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 8;
}

.ring-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear, stroke 0.3s;
}

.timer-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

.timer-display {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
}

.timer-display.finished {
  color: #e63946;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.05); }
}

.timer-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-align: center;
}

/* Alert */
.timer-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  background: #fff5f5;
  border: 1px solid #fbc4c4;
  border-radius: var(--radius);
  animation: slide-in 0.3s ease;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.alert-icon { font-size: 1.5rem; flex-shrink: 0; }

.alert-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #c0392b;
}

.alert-body {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
  line-height: 1.5;
}

/* Timer controls */
.timer-controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.ctrl-btn {
  padding: 0.65rem 1.75rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  transition: opacity 0.2s, transform 0.1s;
}

.ctrl-btn:hover  { opacity: 0.85; }
.ctrl-btn:active { transform: scale(0.97); }

.start-btn { background: #4caf50; color: #fff; }
.pause-btn { background: #f9c74f; color: #1a1a2e; }
.reset-btn { background: var(--border); color: var(--text-primary); }

@media (max-width: 480px) {
  .result-row    { flex-direction: column; gap: 0.75rem; }
  .result-divider { width: 100%; height: 1px; }
  .coverage-btn  { min-width: 90px; }
}
</style>
