<template>
  <div class="d-flex flex-column gap-3">

    <!-- ── Dosage Calculator (US3.1) ───────────────────────────────── -->
    <section class="card shadow-sm border-0">
      <div class="card-body p-4 d-flex flex-column gap-4">
        <div>
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h2 class="h5 fw-bold mb-0">🧴 Sunscreen Dosage Calculator</h2>
            <span v-if="uvStore.locationName" class="badge bg-light text-dark border small">
              📍 Location UV: {{ uvStore.uvIndex ?? '—' }} ({{ uvStore.locationName }})
            </span>
          </div>
          <p class="text-muted small mb-0 mt-1">
            Calculate accurate clinical sunscreen amounts (teaspoons &amp; bottle pumps) based on the Cancer Council Australia teaspoon rule.
          </p>
        </div>

        <!-- UV index input slider -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-1">
            <label class="form-label fw-bold text-uppercase text-muted small mb-0" style="letter-spacing: 0.5px">
              UV Index
            </label>
            <span class="badge rounded-pill fw-bold px-2 py-1" :style="{ background: uvInfo.color, color: '#fff' }">
              {{ uvInfo.label }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-3">
            <input
              v-model.number="uvInput"
              type="range"
              min="0"
              max="13"
              step="1"
              class="form-range flex-grow-1"
              :style="{ accentColor: uvInfo.color }"
            />
            <div class="uv-badge shadow-sm" :style="{ background: uvInfo.color }">{{ uvInput }}</div>
          </div>
          <div class="text-muted small mt-1">
            Drag the slider to adjust UV level (0 = Night/Low to 13 = Extreme midday Australian summer).
          </div>
        </div>

        <!-- Coverage area selector -->
        <div>
          <label class="form-label fw-bold text-uppercase text-muted small mb-2" style="letter-spacing: 0.5px">
            Select Exposed Coverage Area
          </label>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="opt in coverageOptions"
              :key="opt.id"
              class="coverage-btn btn d-flex flex-column align-items-center gap-1 py-3 px-2 shadow-sm"
              :class="{ selected: selectedCoverage === opt.id }"
              @click="selectedCoverage = opt.id"
            >
              <span style="font-size: 1.6rem">{{ opt.icon }}</span>
              <span class="fw-bold" style="font-size: 0.82rem; text-align: center">{{ opt.name }}</span>
              <span class="text-muted" style="font-size: 0.7rem">{{ opt.bodyPartHint }}</span>
            </button>
          </div>
        </div>

        <!-- Result Box (teaspoons, pumps, SPF) -->
        <div class="result-box rounded-3 p-3.5" :style="{ borderColor: uvInfo.color, background: '#faf9f6' }">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="result-item flex-fill text-center">
              <div class="fw-bold fs-4" style="color: var(--text-primary)">{{ dosage.spf }}</div>
              <div class="text-muted" style="font-size: 0.72rem; text-transform: uppercase">Recommended SPF</div>
            </div>
            <div class="result-divider"></div>
            <div class="result-item flex-fill text-center">
              <div class="fw-bold fs-4" :style="{ color: uvInfo.color }">{{ dosage.teaspoons }} tsp</div>
              <div class="text-muted" style="font-size: 0.72rem; text-transform: uppercase">Amount to apply</div>
            </div>
            <div class="result-divider"></div>
            <div class="result-item flex-fill text-center">
              <div class="fw-bold fs-4" style="color: var(--text-primary)">≈ {{ dosage.pumps }} pumps</div>
              <div class="text-muted" style="font-size: 0.72rem; text-transform: uppercase">Pump equivalent</div>
            </div>
          </div>

          <p class="text-muted small text-center mb-3 fw-semibold">
            {{ dosage.note }}
          </p>

          <button
            class="btn w-100 fw-bold py-2.5 shadow-sm text-white"
            style="background: var(--color-high);"
            @click="setReminderFromCalculator"
          >
            ⏱ Start Reapplication Countdown ({{ dosage.intervalLabel }})
          </button>
        </div>

        <p class="text-muted text-center border-top pt-3 mb-0" style="font-size: 0.75rem">
          Based on Cancer Council Australia's standard dosage recommendation: 1 teaspoon (~5ml) per limb, face/neck, front torso, and back torso (clinical standard: 2 mg/cm²).
        </p>
      </div>
    </section>

    <!-- ── Reapplication Reminder Timer (US3.2) ────────────────────── -->
    <section class="card shadow-sm border-0" ref="reminderSection">
      <div class="card-body p-4 d-flex flex-column gap-4">
        <div>
          <h2 class="h5 fw-bold mb-1">⏱ Reapplication Reminder</h2>
          <p class="text-muted small mb-0">
            Set an automated reminder timer to ensure uninterrupted sun protection while spending time outdoors.
          </p>
        </div>

        <!-- Interval selector -->
        <div>
          <label class="form-label fw-bold text-uppercase text-muted small mb-2" style="letter-spacing: 0.5px">
            Reminder Interval
          </label>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="opt in intervalOptions"
              :key="opt.seconds"
              class="interval-btn btn flex-fill fw-bold py-2"
              :class="{ selected: selectedInterval === opt.seconds }"
              :disabled="timerRunning"
              @click="setIntervalOption(opt.seconds)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Circular Countdown Display -->
        <div class="timer-wrap mx-auto">
          <svg class="timer-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" class="ring-bg" />
            <circle
              cx="60" cy="60" r="52"
              class="ring-progress"
              :stroke="timerFinished ? '#e63946' : uvInfo.color"
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
        <div v-if="timerFinished" class="alert alert-danger d-flex align-items-start gap-3 mb-0 shadow-sm border-0">
          <span style="font-size: 1.8rem; line-height: 1">🚨</span>
          <div>
            <div class="fw-bold fs-6">Time to reapply your sunscreen!</div>
            <div class="small mt-1">
              Your protection window has lapsed. Apply <strong>{{ currentDosageSummary }}</strong> to all exposed skin before continuing outdoor activities.
            </div>
          </div>
        </div>

        <!-- Timer Controls -->
        <div class="d-flex gap-2 justify-content-center flex-wrap">
          <button v-if="!timerRunning && !timerFinished" class="btn btn-success fw-bold px-4 py-2" @click="startTimer">
            ▶ Start Timer
          </button>
          <button v-if="timerRunning" class="btn fw-bold px-4 py-2 text-white" style="background: #e67e22" @click="pauseTimer">
            ⏸ Pause
          </button>
          <button
            v-if="timerFinished || timerRunning || remaining < selectedInterval"
            class="btn btn-outline-secondary fw-bold px-4 py-2"
            @click="resetTimer"
          >
            ↺ Reset
          </button>
        </div>

        <div class="text-center text-muted small" style="font-size: 0.74rem">
          Tip: If swimming, sweating heavily, or towel drying, reapply immediately without waiting for the timer to expire.
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { uvStore } from '@/stores/uvStore.js'

// ── UV level helpers ──────────────────────────────────────────────
// Inherit today's UV if user looked up their location on Page 1
const uvInput = ref(uvStore.uvIndex != null && uvStore.uvIndex > 0 ? uvStore.uvIndex : 6)

const UV_BANDS = [
  { max: 2,  label: 'Low',       color: '#4caf50', spf: 'SPF 30',  interval: 7200 },
  { max: 5,  label: 'Moderate',  color: '#f9c74f', spf: 'SPF 30+', interval: 7200 },
  { max: 7,  label: 'High',      color: '#f77f00', spf: 'SPF 50+', interval: 5400 },
  { max: 10, label: 'Very High', color: '#e63946', spf: 'SPF 50+', interval: 5400 },
  { max: 99, label: 'Extreme',   color: '#7b2d8b', spf: 'SPF 50+', interval: 5400 },
]

const uvInfo = computed(() => UV_BANDS.find(b => uvInput.value <= b.max) || UV_BANDS[2])

// ── Coverage options (US3.1) ──────────────────────────────────────
const coverageOptions = [
  { id: 'face',     icon: '😊', name: 'Face, Neck & Ears', bodyPartHint: '1 tsp (~5ml)',   teaspoons: 1, pumps: 5  },
  { id: 'arms',     icon: '💪', name: 'Face & Both Arms',  bodyPartHint: '3 tsp (~15ml)',  teaspoons: 3, pumps: 15 },
  { id: 'fullbody', icon: '🧍', name: 'Full Body Swimwear',bodyPartHint: '7 tsp (~35ml)',  teaspoons: 7, pumps: 35 },
]
const selectedCoverage = ref('arms')

const INTERVAL_NOTES = {
  7200: 'every 2 hours',
  5400: 'every 90 minutes',
}

const dosage = computed(() => {
  const band    = uvInfo.value
  const area    = coverageOptions.find(c => c.id === selectedCoverage.value) || coverageOptions[1]
  const intSecs = band.interval
  const intLbl  = intSecs === 7200 ? '2 hours' : '90 min'
  return {
    spf:           band.spf,
    teaspoons:     area.teaspoons,
    pumps:         area.pumps,
    intervalLabel: intLbl,
    note: `Reapply ${INTERVAL_NOTES[intSecs]} or immediately after swimming/sweating. Apply 20 minutes before heading outdoors.`,
  }
})

const currentDosageSummary = computed(() =>
  `${dosage.value.teaspoons} teaspoon${dosage.value.teaspoons > 1 ? 's' : ''} (≈ ${dosage.value.pumps} bottle pumps) of ${dosage.value.spf}`
)

// ── Reapplication Reminder Timer (US3.2) ──────────────────────────
const intervalOptions = [
  { label: '⚡ Demo (10 sec)', seconds: 10 },
  { label: '90 minutes (High UV)', seconds: 5400 },
  { label: '2 hours (Standard)',   seconds: 7200 },
]
const selectedInterval = ref(5400)
const remaining        = ref(5400)
const timerRunning     = ref(false)
const timerFinished    = ref(false)
const reminderSection  = ref(null)

let _interval = null

function setIntervalOption(secs) {
  selectedInterval.value = secs
  resetTimer()
}

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
  if (timerRunning.value)  return 'time remaining'
  if (remaining.value < selectedInterval.value) return 'paused'
  return 'ready to start'
})

// SVG ring progress
const ringCircumference = 2 * Math.PI * 52   // ≈ 326.7
const ringOffset = computed(() => {
  const progress = remaining.value / selectedInterval.value
  return ringCircumference * (1 - progress)
})

function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15) // A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.6)
  } catch {
    // Audio context not allowed without interaction
  }
}

function startTimer() {
  timerFinished.value = false
  timerRunning.value  = true
  _interval = setInterval(() => {
    if (remaining.value <= 1) {
      remaining.value     = 0
      timerRunning.value  = false
      timerFinished.value = true
      clearInterval(_interval)
      playChime()
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
  startTimer()
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
  font-size: 1.15rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  transition: background 0.2s;
}

/* ── Coverage & interval buttons ────────────────────────────────── */
.coverage-btn {
  flex: 1;
  min-width: 120px;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius);
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
}

.coverage-btn:hover {
  transform: translateY(-2px);
}

.coverage-btn.selected {
  border-color: var(--color-high);
  background: #fff5ee;
}

.interval-btn {
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  font-size: 0.84rem;
  transition: border-color 0.2s, background 0.2s;
}

.interval-btn.selected {
  border-color: var(--color-high);
  background: #fff5ee;
  color: var(--text-primary);
}

.interval-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Result box border ───────────────────────────────────────────── */
.result-box {
  border: 2px solid;
  transition: border-color 0.2s;
}

.result-divider {
  width: 1px;
  height: 44px;
  background: var(--border);
  flex-shrink: 0;
}

/* ── Timer ring ──────────────────────────────────────────────────── */
.timer-wrap {
  position: relative;
  width: 170px;
  height: 170px;
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
  font-size: 1.85rem;
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
  50%       { transform: scale(1.06); }
}

.timer-label {
  font-size: 0.74rem;
  color: var(--text-secondary);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 480px) {
  .result-divider { width: 100%; height: 1px; }
  .coverage-btn   { min-width: 95px; }
}
</style>
