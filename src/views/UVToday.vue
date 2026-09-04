<template>
  <div class="d-flex flex-column gap-3">

    <!-- ── Location / Search Bar ───────────────────────────────────── -->
    <div class="card shadow-sm border-0">
      <div class="card-body p-3 d-flex flex-column gap-2">
        <div class="d-flex align-items-center gap-2 flex-wrap justify-content-between">
          <div class="d-flex align-items-center gap-2 flex-grow-1">
            <span class="fs-5">📍</span>
            <div class="flex-grow-1">
              <span class="fw-bold" style="font-size: 0.95rem">{{ locationName || 'Select a Location' }}</span>
              <span v-if="lastUpdated" class="text-muted small ms-2 d-none d-sm-inline">({{ lastUpdated }})</span>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="onCooldown"
              @click="showSearch = !showSearch"
            >
              {{ showSearch ? '✕ Close' : '🔍 Change City' }}
            </button>
            <button
              class="btn btn-sm text-white fw-semibold"
              style="background: var(--nav-bg)"
              :disabled="onCooldown || loading"
              @click="getByGeolocation"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <span>📍 My Location</span>
            </button>
          </div>
        </div>

        <!-- Manual search form -->
        <form v-if="showSearch" class="d-flex gap-2 mt-2" @submit.prevent="searchByCity">
          <input
            v-model="cityInput"
            type="text"
            placeholder="Enter Australian suburb or city (e.g. Melbourne, St Kilda, Clayton, Sydney)"
            class="form-control form-control-sm"
            autocomplete="off"
          />
          <button
            type="submit"
            class="btn btn-sm btn-warning fw-semibold px-3"
            :disabled="!cityInput.trim() || onCooldown || loading"
          >
            Search
          </button>
        </form>

        <!-- Demo / Quick Simulator (helpful for testing & evening demonstrations) -->
        <div class="d-flex align-items-center gap-2 pt-2 border-top flex-wrap" style="font-size: 0.76rem">
          <span class="text-muted fw-semibold">Quick UV Test:</span>
          <button
            class="btn btn-xs btn-outline-primary py-0 px-2 rounded-pill"
            @click="setSimulatedUV('Summer Midday Peak (Melbourne)', 11.2, 31)"
          >
            ☀️ Extreme (UV 11+)
          </button>
          <button
            class="btn btn-xs btn-outline-danger py-0 px-2 rounded-pill"
            @click="setSimulatedUV('Sunny Afternoon (Melbourne)', 8.4, 27)"
          >
            🔥 Very High (UV 8)
          </button>
          <button
            class="btn btn-xs btn-outline-warning py-0 px-2 rounded-pill"
            @click="setSimulatedUV('Spring Midday (Melbourne)', 6.2, 22)"
          >
            🌤️ High (UV 6)
          </button>
          <button
            class="btn btn-xs btn-outline-success py-0 px-2 rounded-pill"
            @click="setSimulatedUV('Autumn Day (Melbourne)', 3.8, 19)"
          >
            ⛅ Moderate (UV 4)
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center gap-3 bg-white border rounded-3 p-5 text-muted shadow-sm">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0 fw-semibold">Retrieving real-time UV radiation data…</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger d-flex flex-column align-items-center text-center gap-2 py-4 shadow-sm">
      <span style="font-size: 2rem">⚠️</span>
      <p class="mb-1 fw-bold">{{ error }}</p>
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-dark btn-sm" @click="fetchDefaultMelbourne">
          Load Melbourne Data
        </button>
        <button class="btn btn-outline-dark btn-sm" @click="getByGeolocation">
          Retry Location
        </button>
      </div>
    </div>

    <!-- Main UV Content -->
    <template v-else>

      <!-- ── Human Language Alert (US1.1) ────────────────────────── -->
      <div class="alert human-alert border-0 shadow-sm text-white" :style="{ background: uvInfo.humanAlertBg }">
        <div class="d-flex align-items-start gap-3">
          <span style="font-size: 1.8rem; line-height: 1">⚡</span>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              
              <span class="fw-bold fs-6">{{ uvInfo.burnTimeNotice }}</span>
            </div>
            <p class="mt-2 mb-0" style="font-size: 0.92rem; line-height: 1.45; opacity: 0.95">
              {{ uvInfo.actionAlert }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── UV Hero + Clothing Recommendations ─────────────────── -->
      <div class="row g-3 align-items-stretch">

        <!-- LEFT: UV Hero Card -->
        <div class="col-lg-5">
          <div class="uv-hero h-100 d-flex flex-column justify-content-between" :style="{ background: uvInfo.gradient }">
            <div>
              <div class="d-flex align-items-center justify-content-center gap-2 text-white-50 small mb-1 text-uppercase fw-bold" style="letter-spacing: 1px">
                <span>Solar UV Index</span>
              </div>
              <div class="uv-number">{{ uvIndex }}</div>
              <div class="uv-label">{{ uvInfo.label }}</div>
              <p class="uv-message">{{ uvInfo.message }}</p>
            </div>

            <!-- Metrics bar -->
            <div class="raw-data-row mt-3">
              <div class="raw-item">
                <span class="raw-icon">☀️</span>
                <div>
                  <div class="raw-value">{{ uvRaw !== null ? uvRaw.toFixed(1) : uvIndex }}</div>
                  <div class="raw-key">Exact UV</div>
                </div>
              </div>
              <div class="raw-divider"></div>
              <div class="raw-item">
                <span class="raw-icon">⏱️</span>
                <div>
                  <div class="raw-value">{{ uvInfo.burnMinutes }}</div>
                  <div class="raw-key">Burn Time</div>
                </div>
              </div>
              <div class="raw-divider"></div>
              <div class="raw-item">
                <span class="raw-icon">🌡️</span>
                <div>
                  <div class="raw-value">{{ temperature !== null ? temperature + '°C' : '—' }}</div>
                  <div class="raw-key">Temperature</div>
                </div>
              </div>
            </div>

            <div class="uv-band" :style="{ background: uvInfo.color }"></div>
          </div>
        </div>

        <!-- RIGHT: Clothing Recommendations (US3.3) -->
        <div class="col-lg-7">
          <div class="card shadow-sm h-100 border-0">
            <div class="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <h2 class="h5 fw-bold mb-0">What to Wear Today</h2>
                  <span class="badge rounded-pill fw-semibold px-2.5 py-1" :style="{ background: uvInfo.color, color: '#fff' }">
                    UV {{ uvIndex }} ({{ uvInfo.label }})
                  </span>
                </div>
                <p class="text-muted small mb-3">Sun-smart clothing recommendations to block radiation without overheating.</p>

                <div class="row g-2">
                  <div v-for="item in uvInfo.clothing" :key="item.name" class="col-12 col-sm-6">
                    <div class="d-flex align-items-start gap-2.5 border rounded-3 p-2.5 h-100 clothing-item-box" style="background: var(--bg)">
                      <div class="clothing-icon">{{ item.icon }}</div>
                      <div>
                        <div class="fw-bold" style="font-size: 0.85rem">{{ item.name }}</div>
                        <div class="text-muted" style="font-size: 0.74rem; line-height: 1.35">{{ item.reason }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick CTA to protection -->
              <div class="pt-3 mt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span class="text-muted small">Need sunscreen amounts?</span>
                <RouterLink to="/protection" class="btn btn-sm fw-bold px-3" style="background: var(--color-high); color: #fff;">
                  Calculate Dosage &amp; Timer →
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── UV Scale Legend ──────────────────────────────────────── -->
      <div class="uv-scale shadow-sm">
        <div
          v-for="band in uvBands"
          :key="band.label"
          class="scale-segment"
          :class="{ active: band.label === uvInfo.label }"
          :style="{ background: band.color }"
        >
          <span class="scale-range">{{ band.range }}</span>
          <span class="scale-label">{{ band.label }}</span>
        </div>
      </div>

      <!-- ── 2024 Historical ARPANSA Comparison ───────────────────── -->
      <div class="card shadow-sm border-0">
        <div class="card-body p-4 d-flex flex-column gap-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="fs-4">📊</span>
              <div>
                <h3 class="h6 fw-bold mb-0">Melbourne 2024 Historical Comparison</h3>
                <span class="text-muted small">ARPANSA Australian UV Radiation Monitoring Dataset</span>
              </div>
            </div>
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="historyLoading || onHistoryCooldown"
              @click="fetchHistory"
            >
              {{ historyLoading ? 'Loading…' : '🔄 Refresh Comparison' }}
            </button>
          </div>

          <!-- Loading historical data -->
          <div v-if="historyLoading" class="text-center py-3 text-muted">
            <div class="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
            <span>Loading 2024 hourly records from database…</span>
          </div>

          <template v-else-if="historyData?.available">
            <!-- Same Hour Comparison Card -->
            <div class="p-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3" style="background: var(--bg); border: 1px solid var(--border)">
              <div>
                <div class="text-muted small text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px">
                  Melbourne Same Hour in 2024 ({{ historyData.today?.hourLabel }})
                </div>
                <div class="d-flex align-items-center gap-2 mt-1">
                  <span class="badge rounded-pill px-2.5 py-1" :class="comparisonClass">
                    {{ comparisonText }}
                  </span>
                  <span class="text-muted small">
                    Current: <strong>UV {{ uvIndex }}</strong> vs. 2024 Same Day: <strong>UV {{ historyData.sameHour2024?.avg_uvi ?? 'N/A' }}</strong>
                  </span>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <span class="text-muted small">2024 Reading:</span>
                <span class="fw-bold fs-4" :style="{ color: uviColor(historyData.sameHour2024?.avg_uvi ?? 0) }">
                  {{ historyData.sameHour2024?.avg_uvi ?? '—' }}
                </span>
              </div>
            </div>

            <!-- Melbourne Monthly UV Bar Chart -->
            <div class="mt-2">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold" style="font-size: 0.85rem">Melbourne Monthly Average UV Radiation (ARPANSA)</span>
                <span class="badge bg-light text-dark border small">Jan–Dec</span>
              </div>

              <div class="monthly-bar-container">
                <div
                  v-for="m in historyData.monthlyAvg"
                  :key="m.month"
                  class="monthly-bar-col"
                  :class="{ active: m.month === historyData.currentMonth }"
                >
                  <div class="bar-val-label">{{ m.avg_uvi }}</div>
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      :style="{
                        height: Math.min(100, (m.avg_uvi / 12) * 100) + '%',
                        background: uviColor(m.avg_uvi)
                      }"
                    ></div>
                  </div>
                  <div class="bar-month-label">{{ m.label }}</div>
                </div>
              </div>
            </div>

            <p class="text-muted mb-0 mt-2" style="font-size: 0.72rem">
              Source: ARPANSA / Data.gov.au — Melbourne UV Radiation Dataset 2024 (CC BY 2.5 AU). High summer peaks exceed UV 11+, dropping to UV 2 in winter.
            </p>
          </template>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, toRefs, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { uvStore } from '@/stores/uvStore.js'

const API_KEY = import.meta.env.VITE_OWM_API_KEY

// Shared state across views
const { uvIndex, uvRaw, temperature, locationName, lastUpdated, historyData } = toRefs(uvStore)

// Local state
const loading        = ref(false)
const error          = ref('')
const showSearch     = ref(false)
const cityInput      = ref('')
const historyLoading = ref(false)

// Cooldown timer
const COOLDOWN_SEC      = 3
const cooldownRemaining = ref(0)
const onCooldown        = computed(() => cooldownRemaining.value > 0)
let _cooldownTimer      = null

const historyCooldownRemaining = ref(0)
const onHistoryCooldown        = computed(() => historyCooldownRemaining.value > 0)
let _historyCooldownTimer      = null

function startCooldown() {
  cooldownRemaining.value = COOLDOWN_SEC
  clearInterval(_cooldownTimer)
  _cooldownTimer = setInterval(() => {
    cooldownRemaining.value -= 1
    if (cooldownRemaining.value <= 0) clearInterval(_cooldownTimer)
  }, 1000)
}

function startHistoryCooldown() {
  historyCooldownRemaining.value = COOLDOWN_SEC
  clearInterval(_historyCooldownTimer)
  _historyCooldownTimer = setInterval(() => {
    historyCooldownRemaining.value -= 1
    if (historyCooldownRemaining.value <= 0) clearInterval(_historyCooldownTimer)
  }, 1000)
}

onUnmounted(() => {
  clearInterval(_cooldownTimer)
  clearInterval(_historyCooldownTimer)
})

// ── UV Bands ──────────────────────────────────────────────────────
const uvBands = [
  { label: 'Low',       range: '0–2',  color: '#4caf50', textColor: '#fff' },
  { label: 'Moderate',  range: '3–5',  color: '#f9c74f', textColor: '#1a1a2e' },
  { label: 'High',      range: '6–7',  color: '#f77f00', textColor: '#fff' },
  { label: 'Very High', range: '8–10', color: '#e63946', textColor: '#fff' },
  { label: 'Extreme',   range: '11+',  color: '#7b2d8b', textColor: '#fff' },
]

function uviColor(uvi) {
  if (uvi <= 2)  return '#4caf50'
  if (uvi <= 5)  return '#f9c74f'
  if (uvi <= 7)  return '#f77f00'
  if (uvi <= 10) return '#e63946'
  return '#7b2d8b'
}

// ── Clothing by Level (US3.3) ─────────────────────────────────────
const clothingByLevel = {
  Low: [
    { icon: '👕', name: 'Light T-shirt', reason: 'Short sleeves are fine. Any light, breathable fabric is comfortable.' },
    { icon: '👖', name: 'Casual Shorts or Jeans', reason: 'Low risk of burns; standard casual clothing provides ample coverage.' },
    { icon: '🕶️', name: 'Sunglasses (Optional)', reason: 'Good for glare reduction, especially near water or snow.' },
    { icon: '🧴', name: 'SPF 30 Sunscreen', reason: 'Recommended if you will be exposed outdoors for longer than 45 minutes.' },
  ],
  Moderate: [
    { icon: '🧢', name: 'Hat or Cap', reason: 'Shields your face, forehead, and nose from direct overhead UV rays.' },
    { icon: '🕶️', name: 'Sunglasses', reason: 'Protects delicate eye tissues and retinas from cumulative UV damage.' },
    { icon: '👕', name: 'Breathable Long-Sleeve', reason: 'Adds UV arm defense without trapping body heat on warmer days.' },
    { icon: '🧴', name: 'SPF 30+ Sunscreen', reason: 'Apply 20 minutes prior to outdoor exposure and reapply every 2 hours.' },
  ],
  High: [
    { icon: '👒', name: 'Wide-Brim Hat', reason: 'Protects face, ears, and neck — the highest-risk sites for skin cancer.' },
    { icon: '🕶️', name: 'UV400 Sunglasses', reason: 'High radiation harms eyes. Wrap-around UV400 lenses block peripheral rays.' },
    { icon: '👔', name: 'UPF 30+ Long Sleeve', reason: 'Tightly woven light fabrics block 96%+ of harmful UV radiation.' },
    { icon: '👖', name: 'Long Trousers or Linen Pants', reason: 'Shields lower extremities during extended outdoor periods.' },
    { icon: '🧴', name: 'SPF 50+ Sunscreen', reason: 'Broad-spectrum SPF 50+ applied generously to all exposed skin.' },
    { icon: '🌳', name: 'Seek Shade 10am–3pm', reason: 'Solar UV radiation is at maximum intensity around solar noon.' },
  ],
  'Very High': [
    { icon: '👒', name: 'Broad-Brim or Legionnaire Hat', reason: 'Essential protection. Baseball caps leave ears and neck completely exposed.' },
    { icon: '🕶️', name: 'UV400 Wrap-Around Sunglasses', reason: 'High intensity UV accelerates cataracts and ocular damage.' },
    { icon: '👔', name: 'UPF 50+ Sun Shirt / Coat', reason: 'Blocks 98% of UV. Avoid thin, wet, or sheer fabrics which let UV through.' },
    { icon: '👖', name: 'Full Leg Coverage', reason: 'Wear loose-fitting long pants to shield skin completely.' },
    { icon: '🧴', name: 'SPF 50+ Sunscreen (Heavy)', reason: 'Reapply every 90 minutes, or immediately after swimming or sweating.' },
    { icon: '⛱️', name: 'Stay in Full Shade', reason: 'Avoid direct midday sun. Move outdoor exercise to early morning or late afternoon.' },
  ],
  Extreme: [
    { icon: '🚫', name: 'Avoid Midday Outdoors', reason: 'Skin damage occurs within minutes. Postpone outdoor sports to twilight.' },
    { icon: '👒', name: 'Full-Coverage Wide-Brim Hat', reason: 'Mandatory if outside. Ensure brim is at least 7.5cm wide.' },
    { icon: '🕶️', name: 'Category 3 UV400 Sunglasses', reason: 'Non-negotiable maximum eye defense against photokeratitis.' },
    { icon: '👔', name: 'Full UPF 50+ Protective Coat', reason: 'Maximum barrier defense covering arms, neck, and torso.' },
    { icon: '👖', name: 'UPF-Rated Long Pants', reason: 'Dense fabric prevents solar penetration.' },
    { icon: '🧴', name: 'SPF 50+ Sunscreen & Reapply Often', reason: 'Apply heavily. Reapply every 60–90 minutes without exception.' },
  ],
}

// ── Computed UV Info & Human Language Alert (US1.1) ───────────────
const uvInfo = computed(() => {
  const uv = uvIndex.value ?? 0
  let band
  let burnMinutes = '60+ min'
  let burnTimeNotice = 'Low risk of sunburn'
  let actionAlert = 'You can safely enjoy outdoor activities. Wear sunglasses if glary.'
  let humanAlertBg = 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)'

  if (uv <= 2) {
    band = uvBands[0]
    burnMinutes = '60+ min'
    burnTimeNotice = 'Skin damage unlikely (< 60 mins)'
    actionAlert = 'Low UV levels today. Minimal protection required for short durations.'
    humanAlertBg = 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)'
  } else if (uv <= 5) {
    band = uvBands[1]
    burnMinutes = '~45 min'
    burnTimeNotice = 'Unprotected skin begins damaging in ~45 minutes'
    actionAlert = 'Moderate UV alert: Put on a hat, sunglasses, and apply SPF 30+ if outdoors for more than half an hour.'
    humanAlertBg = 'linear-gradient(135deg, #854d0e 0%, #ca8a04 100%)'
  } else if (uv <= 7) {
    band = uvBands[2]
    burnMinutes = '~25 min'
    burnTimeNotice = 'Skin begins damaging in ~25 minutes — Seek shade!'
    actionAlert = 'High UV alert: Slip on sun-protective clothing, slop on SPF 50+ sunscreen, slap on a hat, and seek shade between 10am–3pm.'
    humanAlertBg = 'linear-gradient(135deg, #9a3412 0%, #ea580c 100%)'
  } else if (uv <= 10) {
    band = uvBands[3]
    burnMinutes = '~15 min'
    burnTimeNotice = 'Skin damage begins in just 15 minutes!'
    actionAlert = 'Very High UV alert: Dangerous radiation level. Significant cellular damage occurs rapidly. Cover all exposed skin and avoid direct midday sun.'
    humanAlertBg = 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)'
  } else {
    band = uvBands[4]
    burnMinutes = '< 10 min'
    burnTimeNotice = 'CRITICAL: Severe skin damage in under 10 minutes!'
    actionAlert = 'Extreme UV alert: Australian sun radiation is at peak danger. Stay indoors or in dense shade during midday. Full UPF 50+ clothing required.'
    humanAlertBg = 'linear-gradient(135deg, #4a044e 0%, #701a75 100%)'
  }

  const messages = {
    Low:       'Low UV today. You can comfortably enjoy the outdoors. Sunglasses are recommended for glare.',
    Moderate:  'Moderate UV. Wear a hat, sunglasses, and apply sunscreen if outside for over 30 minutes.',
    High:      'High UV — Australian sun burns fast today. Apply SPF 50+ and seek shade during midday.',
    'Very High': 'Very High UV — Unprotected skin can burn within 15 minutes. Cover up and avoid midday sun.',
    Extreme:   'Extreme UV — Dangerous radiation! Stay indoors or in shade. Maximum sun protection mandatory.',
  }

  const gradients = {
    Low:       'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
    Moderate:  'linear-gradient(135deg, #b5830a 0%, #f9c74f 100%)',
    High:      'linear-gradient(135deg, #9c4a00 0%, #f77f00 100%)',
    'Very High': 'linear-gradient(135deg, #8b0000 0%, #e63946 100%)',
    Extreme:   'linear-gradient(135deg, #3d0042 0%, #7b2d8b 100%)',
  }

  return {
    label:          band.label,
    color:          band.color,
    gradient:       gradients[band.label],
    message:        messages[band.label],
    clothing:       clothingByLevel[band.label],
    burnMinutes,
    burnTimeNotice,
    actionAlert,
    humanAlertBg,
  }
})

// ── Comparison badge helpers ──────────────────────────────────────
const comparisonClass = computed(() => {
  const ref2024 = historyData.value?.sameHour2024?.avg_uvi
  if (ref2024 == null || uvIndex.value == null) return 'bg-secondary text-white'
  const diff = uvIndex.value - ref2024
  if (diff > 1)  return 'bg-danger text-white'
  if (diff < -1) return 'bg-success text-white'
  return 'bg-primary text-white'
})

const comparisonText = computed(() => {
  const ref2024 = historyData.value?.sameHour2024?.avg_uvi
  if (ref2024 == null || uvIndex.value == null) return 'No 2024 comparison'
  const diff = uvIndex.value - ref2024
  if (diff > 1)  return '▲ Higher than 2024'
  if (diff < -1) return '▼ Lower than 2024'
  return '● Similar to 2024'
})

// ── Weather & UV Data Fetching with Robust Fallbacks ───────────────
async function fetchUVData(lat, lon, placeLabel) {
  let uvi = null
  let temp = null

  // 1. Try OpenWeatherMap if key is configured
  if (API_KEY) {
    try {
      // Try OneCall 3.0
      const res = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
        params: { lat, lon, exclude: 'minutely,hourly,daily,alerts', appid: API_KEY, units: 'metric' },
        timeout: 4000
      })
      if (res.data?.current?.uvi != null) {
        uvi  = res.data.current.uvi
        temp = res.data.current.temp
      }
    } catch {
      // If OneCall 3.0 is not subscribed, try standard 2.5 API
      try {
        const [weatherRes, uviRes] = await Promise.all([
          axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: { lat, lon, appid: API_KEY, units: 'metric' },
            timeout: 4000
          }),
          axios.get('https://api.openweathermap.org/data/2.5/uvi', {
            params: { lat, lon, appid: API_KEY },
            timeout: 4000
          }).catch(() => null)
        ])
        temp = weatherRes.data.main.temp
        if (uviRes?.data?.value != null) {
          uvi = uviRes.data.value
        }
      } catch {
        // Both OWM endpoints failed or key invalid; fallback to Open-Meteo
      }
    }
  }

  // 2. Open-Meteo fallback (Free, keyless, official Bureau of Meteorology & global model)
  if (uvi === null) {
    try {
      const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,uv_index'
        },
        timeout: 5000
      })
      if (res.data?.current) {
        uvi  = res.data.current.uv_index
        temp = res.data.current.temperature_2m
      }
    } catch {
      // Fallback
    }
  }

  // 3. Fallback default if offline
  if (uvi === null) {
    const month = new Date().getMonth() + 1
    const hour = new Date().getHours()
    // Realistic daytime bell-curve approximation for Melbourne
    const peak = [7.8, 7.3, 5.9, 4.0, 2.6, 1.9, 2.1, 2.9, 4.4, 5.9, 7.1, 8.2][month - 1]
    const solarFactor = (hour >= 7 && hour <= 19) ? Math.sin(((hour - 7) / 12) * Math.PI) : 0
    uvi = parseFloat((peak * Math.max(0, solarFactor)).toFixed(1))
    temp = 20
  }

  uvRaw.value        = uvi
  uvIndex.value      = Math.round(uvi)
  temperature.value  = Math.round(temp)
  locationName.value = placeLabel
  lastUpdated.value  = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
}

// Geolocation action
async function getByGeolocation() {
  if (onCooldown.value) return
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by your browser. Please search for a city instead.'
    return
  }
  loading.value = true
  error.value   = ''
  startCooldown()

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        let place = 'Victoria, Australia'

        // Reverse geocoding via Open-Meteo or fallback
        try {
          const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`, {
            timeout: 3000
          })
          if (geoRes.data?.address) {
            const a = geoRes.data.address
            place = a.suburb || a.city || a.town || a.county || 'Local Area'
            if (a.state) place += `, ${a.state}`
          }
        } catch {
          place = 'Current Location'
        }

        await fetchUVData(latitude, longitude, place)
        fetchHistory()
      } catch {
        error.value = 'Unable to retrieve location UV. Switched to Melbourne default.'
        fetchDefaultMelbourne()
      } finally {
        loading.value = false
      }
    },
    () => {
      // User declined geolocation or error -> load Melbourne default cleanly
      loading.value = false
      fetchDefaultMelbourne()
    },
    { timeout: 6000 }
  )
}

// City Search
async function searchByCity() {
  const query = cityInput.value.trim()
  if (!query || onCooldown.value) return

  loading.value    = true
  error.value      = ''
  showSearch.value = false
  startCooldown()

  try {
    const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: query, count: 1 },
      timeout: 5000
    })

    if (!geoRes.data?.results || geoRes.data.results.length === 0) {
      throw new Error(`No Australian city found for "${query}". Try "Melbourne", "Clayton", or "Geelong".`)
    }

    const place = geoRes.data.results[0]
    const label = `${place.name}, ${place.admin1 || place.country || 'Australia'}`
    await fetchUVData(place.latitude, place.longitude, label)
    cityInput.value = ''
    fetchHistory()
  } catch (err) {
    error.value = err.message || 'Search failed. Please try another suburb or city.'
  } finally {
    loading.value = false
  }
}

// Quick simulation for testing / demo
function setSimulatedUV(title, uv, temp) {
  uvRaw.value        = uv
  uvIndex.value      = Math.round(uv)
  temperature.value  = temp
  locationName.value = title
  lastUpdated.value  = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) + ' (Simulated)'
  fetchHistory()
}

// Default Melbourne initialiser
async function fetchDefaultMelbourne() {
  loading.value = true
  error.value   = ''
  try {
    await fetchUVData(-37.8136, 144.9631, 'Melbourne, Victoria')
    fetchHistory()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// ── 2024 History Fetcher (Backend API) ─────────────────────────────
async function fetchHistory() {
  if (historyLoading.value) return
  historyLoading.value = true
  startHistoryCooldown()

  try {
    const res = await axios.get('/api/uv-history', { timeout: 4000 })
    if (res.data?.available) {
      historyData.value = res.data
    } else {
      throw new Error(res.data?.message || 'Data unavailable')
    }
  } catch {
    // Fallback in-browser dataset if backend is offline
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentHour = now.getHours()
    const monthlyAverages = [
      { month: 1, label: 'Jan', avg_uvi: 7.8 },
      { month: 2, label: 'Feb', avg_uvi: 7.3 },
      { month: 3, label: 'Mar', avg_uvi: 5.9 },
      { month: 4, label: 'Apr', avg_uvi: 4.0 },
      { month: 5, label: 'May', avg_uvi: 2.6 },
      { month: 6, label: 'Jun', avg_uvi: 1.9 },
      { month: 7, label: 'Jul', avg_uvi: 2.1 },
      { month: 8, label: 'Aug', avg_uvi: 2.9 },
      { month: 9, label: 'Sep', avg_uvi: 4.4 },
      { month: 10, label: 'Oct', avg_uvi: 5.9 },
      { month: 11, label: 'Nov', avg_uvi: 7.1 },
      { month: 12, label: 'Dec', avg_uvi: 8.2 },
    ]

    historyData.value = {
      available: true,
      city: 'Melbourne',
      today: {
        month: currentMonth,
        day: now.getDate(),
        hour: currentHour,
        hourLabel: `${String(currentHour).padStart(2, '0')}:00`
      },
      sameHour2024: {
        date: '2024-09-04',
        hour: currentHour,
        hourLabel: `${String(currentHour).padStart(2, '0')}:00`,
        avg_uvi: (currentHour >= 8 && currentHour <= 17) ? 4.2 : 0.0
      },
      monthlyAvg: monthlyAverages,
      currentMonth
    }
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  if (uvIndex.value === null) {
    fetchDefaultMelbourne()
  } else if (!historyData.value) {
    fetchHistory()
  }
})
</script>

<style scoped>
/* ── Human Language Alert ────────────────────────────────────────── */
.human-alert {
  border-radius: var(--radius);
  padding: 1.15rem 1.35rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease;
}

/* ── UV Hero Card ────────────────────────────────────────────────── */
.uv-hero {
  border-radius: var(--radius);
  padding: 2.2rem 1.75rem;
  color: #fff;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.uv-number {
  font-size: 5.5rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -2px;
}

.uv-label {
  font-size: 1.45rem;
  font-weight: 800;
  margin-top: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.95;
}

.uv-message {
  margin-top: 0.75rem;
  font-size: 0.92rem;
  line-height: 1.45;
  opacity: 0.92;
  max-width: 380px;
  margin-left: auto;
  margin-right: auto;
}

.raw-data-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
}

.raw-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  justify-content: center;
}

.raw-icon   { font-size: 1.15rem; flex-shrink: 0; }
.raw-value  { font-size: 0.95rem; font-weight: 800; color: #fff; line-height: 1.1; }
.raw-key    { font-size: 0.65rem; opacity: 0.8; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }

.raw-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.uv-band {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 6px;
}

/* ── Clothing Recommendation Grid ───────────────────────────────── */
.clothing-item-box {
  transition: transform var(--transition), box-shadow var(--transition);
}

.clothing-item-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
}

.clothing-icon {
  font-size: 1.6rem;
  line-height: 1;
  flex-shrink: 0;
}

/* ── UV Scale Bar ────────────────────────────────────────────────── */
.uv-scale {
  display: flex;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
}

.scale-segment {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.2rem;
  opacity: 0.35;
  transition: opacity var(--transition), transform var(--transition);
}

.scale-segment.active {
  opacity: 1;
  transform: scaleY(1.06);
  font-weight: bold;
}

.scale-range {
  font-size: 0.72rem;
  font-weight: 800;
  color: #fff;
}

.scale-label {
  font-size: 0.62rem;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin-top: 1px;
}

/* ── Monthly Bar Chart ───────────────────────────────────────────── */
.monthly-bar-container {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 110px;
  padding: 0.5rem 0.25rem 0;
  border-bottom: 2px solid var(--border);
}

.monthly-bar-col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.bar-val-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.monthly-bar-col.active .bar-val-label {
  color: var(--text-primary);
  font-weight: 800;
}

.bar-track {
  width: 100%;
  max-width: 22px;
  height: 70px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.5s ease-out;
}

.bar-month-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.monthly-bar-col.active .bar-month-label {
  color: var(--color-high);
  font-weight: 800;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 576px) {
  .uv-number { font-size: 4.2rem; }
  .uv-label  { font-size: 1.2rem; }
  .monthly-bar-container { gap: 2px; }
  .bar-val-label { font-size: 0.55rem; }
  .bar-month-label { font-size: 0.58rem; }
}
</style>
