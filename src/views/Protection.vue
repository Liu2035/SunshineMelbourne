<template>
  <div class="d-flex flex-column gap-3">

    <!-- ── Dosage Calculator ─────────────────────────────────────── -->
    <section class="card shadow-sm">
      <div class="card-body p-4 d-flex flex-column gap-4">
        <div>
          <h2 class="h5 fw-bold mb-1">🧴 Sunscreen Dosage Calculator</h2>
          <p class="text-muted small mb-0">
            Enter today's UV index and choose what you're covering — we'll tell you exactly how much to apply.
          </p>
        </div>

        <!-- UV index input -->
        <div>
          <label class="form-label fw-semibold text-uppercase text-muted" style="font-size: 0.78rem; letter-spacing: 0.05em">UV Index</label>
          <div class="d-flex align-items-center gap-3">
            <input
              v-model.number="uvInput"
              type="range"
              min="0" max="13" step="1"
              class="form-range flex-grow-1"
              :style="{ accentColor: uvInfo.color }"
            />
            <div class="uv-badge" :style="{ background: uvInfo.color }">{{ uvInput }}</div>
          </div>
          <div class="fw-bold small mt-1" :style="{ color: uvInfo.color }">{{ uvInfo.label }}</div>
        </div>

        <!-- Coverage area selector -->
        <div>
          <label class="form-label fw-semibold text-uppercase text-muted" style="font-size: 0.78rem; letter-spacing: 0.05em">Coverage Area</label>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="opt in coverageOptions"
              :key="opt.id"
              class="coverage-btn btn d-flex flex-column align-items-center gap-1 py-3 px-2"
              :class="{ selected: selectedCoverage === opt.id }"
              @click="selectedCoverage = opt.id"
            >
              <span style="font-size: 1.5rem">{{ opt.icon }}</span>
              <span class="fw-semibold" style="font-size: 0.8rem; text-align: center">{{ opt.name }}</span>
            </button>
          </div>
        </div>

        <!-- Result -->
        <div class="result-box rounded-3 p-3" :style="{ borderColor: uvInfo.color }">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="result-item flex-fill text-center">
              <div class="fw-bold fs-5">{{ dosage.spf }}</div>
              <div class="text-muted" style="font-size: 0.72rem">Recommended SPF</div>
            </div>
            <div class="result-divider"></div>
            <div class="result-item flex-fill text-center">
              <div class="fw-bold fs-5">{{ dosage.teaspoons }} tsp</div>
              <div class="text-muted" style="font-size: 0.72rem">Amount to apply</div>
            </div>
            <div class="result-divider"></div>
            <div class="result-item flex-fill text-center">
              <div class="fw-bold fs-5">≈ {{ dosage.pumps }} pumps</div>
              <div class="text-muted" style="font-size: 0.72rem">Pump equivalent</div>
            </div>
          </div>
          <p class="text-muted small text-center mb-3">{{ dosage.note }}</p>
          <button
            class="btn w-100 fw-semibold"
            style="background: var(--color-high); color: #fff;"
            @click="setReminderFromCalculator"
          >
            ⏱ Set Reapplication Reminder ({{ dosage.intervalLabel }})
          </button>
        </div>

        <p class="text-muted text-center border-top pt-3 mb-0" style="font-size: 0.75rem">
          Based on the Cancer Council Australia teaspoon rule and the clinical standard of 2 mg/cm².
        </p>
      </div>
    </section>

    <!-- ── Reapplication Reminder ────────────────────────────────── -->
    <section class="card shadow-sm" ref="reminderSection">
      <div class="card-body p-4 d-flex flex-column gap-4">
        <div>
          <h2 class="h5 fw-bold mb-1">⏱ Reapplication Reminder</h2>
          <p class="text-muted small mb-0">Set a timer to remind yourself when it's time to reapply sunscreen.</p>
        </div>

        <!-- Interval selector -->
        <div>
          <label class="form-label fw-semibold text-uppercase text-muted" style="font-size: 0.78rem; letter-spacing: 0.05em">Remind me every</label>
          <div class="d-flex gap-2">
            <button
              v-for="opt in intervalOptions"
              :key="opt.seconds"
              class="interval-btn btn flex-fill fw-semibold"
              :class="{ selected: selectedInterval === opt.seconds }"
              :disabled="timerRunning"
              @click="selectedInterval = opt.seconds"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Countdown display -->
        <div class="timer-wrap mx-auto">
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
            <div class="timer-display" :class="{ finished: timerFinished }">{{ formattedTime }}</div>
            <div class="timer-label">{{ timerStatusLabel }}</div>
          </div>
        </div>

        <!-- Alert when finished -->
        <div v-if="timerFinished" class="alert alert-danger d-flex align-items-start gap-3 mb-0">
          <span style="font-size: 1.5rem; flex-shrink: 0">☀️</span>
          <div>
            <div class="fw-bold" style="font-size: 0.95rem">Time to reapply sunscreen!</div>
            <div class="small text-muted mt-1">Apply {{ currentDosageSummary }} to all exposed skin before going back out.</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="d-flex gap-3 justify-content-center">
          <button v-if="!timerRunning && !timerFinished" class="btn btn-success fw-bold px-4" @click="startTimer">
            ▶ Start
          </button>
          <button v-if="timerRunning" class="btn fw-bold px-4" style="background: #f9c74f; color: var(--text-primary);" @click="pauseTimer">
            ⏸ Pause
          </button>
          <button
            v-if="timerFinished || timerRunning || remaining < selectedInterval"
            class="btn btn-outline-secondary fw-bold px-4"
            @click="resetTimer"
          >
            ↺ Reset
          </button>
        </div>
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
/* ── UV badge (circular) ─────────────────────────────────────────── */
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

/* ── Coverage & interval toggle buttons ─────────────────────────── */
.coverage-btn {
  flex: 1;
  min-width: 110px;
  border: 2px solid var(--border);
  background: var(--bg);
  border-radius: var(--radius);
  transition: border-color 0.2s, background 0.2s;
}

.coverage-btn.selected {
  border-color: var(--color-high);
  background: #fff4ec;
}

.interval-btn {
  border: 2px solid var(--border);
  background: var(--bg);
  border-radius: 10px;
  transition: border-color 0.2s, background 0.2s;
}

.interval-btn.selected {
  border-color: var(--color-high);
  background: #fff4ec;
}

.interval-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Result box border ───────────────────────────────────────────── */
.result-box {
  border: 2px solid;
  transition: border-color 0.2s;
}

.result-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
  flex-shrink: 0;
}

/* ── Timer ring ──────────────────────────────────────────────────── */
.timer-wrap {
  position: relative;
  width: 160px;
  height: 160px;
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

/* ── Alert slide-in ─────────────────────────────────────────────── */
.alert {
  animation: slide-in 0.3s ease;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .result-divider { width: 100%; height: 1px; }
  .coverage-btn   { min-width: 90px; }
}
</style>
