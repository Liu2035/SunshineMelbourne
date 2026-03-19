<template>
  <div class="d-flex flex-column gap-3">

    <!-- Location bar (only shown after first load) -->
    <template v-if="uvIndex !== null">
      <div class="d-flex align-items-center gap-2 bg-white border rounded-3 px-3 py-2">
        <span>📍</span>
        <span class="fw-semibold flex-grow-1" style="font-size: 0.95rem">{{ locationName }}</span>
        <button
          class="btn btn-sm btn-outline-secondary"
          :disabled="onCooldown"
          @click="showSearch = !showSearch"
        >
          {{ showSearch ? 'Cancel' : (onCooldown ? `${cooldownRemaining}s` : 'Change') }}
        </button>
      </div>

      <!-- Manual city search (change location) -->
      <form v-if="showSearch" class="d-flex gap-2" @submit.prevent="searchByCity">
        <input
          v-model="cityInput"
          type="text"
          placeholder="Enter suburb or city (e.g. Melbourne)"
          class="form-control"
          autocomplete="off"
        />
        <button
          type="submit"
          class="btn btn-warning fw-semibold"
          :disabled="!cityInput.trim() || onCooldown"
        >
          Search
        </button>
      </form>
    </template>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center gap-3 bg-white border rounded-3 p-5 text-muted">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0">Fetching UV data…</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger d-flex flex-column align-items-center text-center gap-2 py-4">
      <span style="font-size: 2rem">⚠️</span>
      <p class="mb-1">{{ error }}</p>
      <button class="btn btn-dark btn-sm" :disabled="onCooldown" @click="init">
        {{ onCooldown ? `Try again in ${cooldownRemaining}s` : 'Try again' }}
      </button>
    </div>

    <!-- No location yet — show both options immediately -->
    <div v-else-if="uvIndex === null" class="card shadow-sm">
      <div class="card-body p-4 d-flex flex-column gap-3">
        <div>
          <div class="fw-bold fs-5">Check today's UV level</div>
          <p class="text-muted small mb-0">Use your device location or search by city.</p>
        </div>

        <button
          class="btn fw-semibold py-2"
          style="background: var(--nav-bg); color: var(--nav-text);"
          :disabled="onCooldown"
          @click="getByGeolocation"
        >
          {{ onCooldown ? `Please wait ${cooldownRemaining}s` : 'Use my location' }}
        </button>

        <div class="d-flex align-items-center gap-2 text-muted small">
          <hr class="flex-grow-1 m-0" /><span>or</span><hr class="flex-grow-1 m-0" />
        </div>

        <form class="d-flex gap-2" @submit.prevent="searchByCity">
          <input
            v-model="cityInput"
            type="text"
            placeholder="Enter suburb or city (e.g. Melbourne)"
            class="form-control"
            autocomplete="off"
          />
          <button
            type="submit"
            class="btn btn-warning fw-semibold"
            :disabled="!cityInput.trim() || onCooldown"
          >
            {{ onCooldown ? `${cooldownRemaining}s` : 'Search' }}
          </button>
        </form>
      </div>
    </div>

    <!-- UV data loaded -->
    <template v-else>

      <!-- UV hero + clothing side by side -->
      <div class="row g-3 align-items-start">

        <!-- LEFT: UV hero card -->
        <div class="col-lg-5">
          <div class="uv-hero h-100" :style="{ background: uvInfo.gradient }">
            <div class="uv-number">{{ uvIndex }}</div>
            <div class="uv-label">{{ uvInfo.label }}</div>
            <p class="uv-message">{{ uvInfo.message }}</p>

            <!-- Raw data row -->
            <div class="raw-data-row">
              <div class="raw-item">
                <span class="raw-icon">☀️</span>
                <div>
                  <div class="raw-value">{{ uvRaw !== null ? uvRaw.toFixed(2) : '—' }}</div>
                  <div class="raw-key">UV Index (raw)</div>
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
              <div class="raw-divider"></div>
              <div class="raw-item">
                <span class="raw-icon">📍</span>
                <div>
                  <div class="raw-value location-raw">{{ locationName || '—' }}</div>
                  <div class="raw-key">Location</div>
                </div>
              </div>
            </div>

            <div class="uv-band" :style="{ background: uvInfo.color }"></div>
          </div>
        </div>

        <!-- RIGHT: clothing recommendations -->
        <div class="col-lg-7">
          <div class="card shadow-sm h-100">
            <div class="card-body p-4">
              <h2 class="h5 fw-bold mb-1">What to Wear Today</h2>
              <p class="text-muted small mb-3">Recommended for UV Index {{ uvIndex }} ({{ uvInfo.label }})</p>
              <div class="row g-2">
                <div v-for="item in uvInfo.clothing" :key="item.name" class="col-12 col-sm-6">
                  <div class="d-flex align-items-start gap-3 border rounded-3 p-3 h-100" style="background: var(--bg)">
                    <div style="font-size: 1.5rem; line-height: 1; flex-shrink: 0">{{ item.icon }}</div>
                    <div>
                      <div class="fw-semibold" style="font-size: 0.88rem">{{ item.name }}</div>
                      <div class="text-muted" style="font-size: 0.78rem; line-height: 1.4">{{ item.reason }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- UV scale legend -->
      <div class="uv-scale">
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

      <!-- History trigger button -->
      <div v-if="!historyData && !historyLoading" class="d-flex flex-column gap-1">
        <button
          class="btn fw-semibold align-self-start px-4"
          style="background: var(--nav-bg); color: var(--nav-text);"
          :disabled="onHistoryCooldown"
          @click="fetchHistory"
        >
          {{ onHistoryCooldown ? `Compare with 2024 (${historyCooldownRemaining}s)` : 'Compare with 2024' }}
        </button>
        <small class="text-muted">See how today's UV compares to the same hour in 2024</small>
      </div>

      <!-- History loading -->
      <div v-if="historyLoading" class="d-flex flex-column align-items-center justify-content-center gap-3 bg-white border rounded-3 p-4 text-muted">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mb-0">Loading 2024 data…</p>
      </div>

      <!-- History error -->
      <div v-if="historyData && !historyData.available" class="alert alert-danger d-flex align-items-start gap-2">
        <span style="font-size: 1.25rem">⚠️</span>
        <div>
          <p class="mb-1">{{ historyData.message || 'Could not load historical data.' }}</p>
          <button class="btn btn-sm btn-outline-danger" @click="fetchHistory">Retry</button>
        </div>
      </div>

      <!-- Historical comparison -->
      <div v-if="historyData?.available" class="card shadow-sm">
        <div class="card-body p-4 d-flex flex-column gap-3">

          <!-- Same-hour 2024 header -->
          <div class="d-flex align-items-center gap-3">
            <span style="font-size: 1.5rem; flex-shrink: 0">📅</span>
            <div class="flex-grow-1">
              <div class="fw-bold">Same Hour in 2024 — Melbourne</div>
              <div class="text-muted small" v-if="historyData.sameHour2024">
                {{ historyData.sameHour2024.date }} at {{ historyData.sameHour2024.hourLabel }}
              </div>
              <div class="text-muted small" v-else>
                No data for {{ historyData.today?.hourLabel }} on this date in 2024
              </div>
            </div>
            <div
              v-if="historyData.sameHour2024"
              class="fw-bold"
              style="font-size: 2rem; line-height: 1;"
              :style="{ color: uviColor(historyData.sameHour2024.avg_uvi) }"
            >
              {{ historyData.sameHour2024.avg_uvi }}
            </div>
          </div>

          <!-- Comparison badge -->
          <div v-if="historyData.sameHour2024" class="d-flex align-items-center flex-wrap gap-2">
            <span class="badge rounded-pill" :class="comparisonClass">{{ comparisonText }}</span>
            <span class="text-muted small">
              Now (UV {{ uvIndex }}) vs. {{ historyData.sameHour2024.date }} {{ historyData.sameHour2024.hourLabel }} (UV {{ historyData.sameHour2024.avg_uvi }})
            </span>
          </div>

          <p class="text-muted border-top pt-3 mb-0" style="font-size: 0.72rem">
            Source: ARPANSA / Data.gov.au — Melbourne UV data 2024 (CC BY 2.5 AU)
          </p>
        </div>
      </div>

      <!-- Jump to Protection -->
      <div class="d-flex align-items-center justify-content-between pt-1">
        <p class="text-muted mb-0" style="font-size: 0.78rem">Last updated: {{ lastUpdated }}</p>
        <RouterLink to="/protection" class="btn btn-sm fw-semibold" style="background: var(--color-high); color: #fff;">
          Sunscreen &amp; Timer →
        </RouterLink>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, toRefs, onUnmounted } from 'vue'
import axios from 'axios'
import { uvStore } from '@/stores/uvStore.js'
import { supabase } from '@/lib/supabase.js'

const API_KEY = import.meta.env.VITE_OWM_API_KEY

// --- Persistent state (survives navigation via shared store) ---
const { uvIndex, uvRaw, temperature, locationName, lastUpdated, historyData } = toRefs(uvStore)

// --- Local-only state ---
const loading        = ref(false)
const error          = ref('')
const showSearch     = ref(false)
const cityInput      = ref('')
const historyLoading = ref(false)

// --- Cooldown (5 s between API calls) ---
const COOLDOWN_SEC     = 5
const cooldownRemaining = ref(0)
const onCooldown       = computed(() => cooldownRemaining.value > 0)
let _cooldownTimer     = null

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

// --- UV band definitions ---
const uvBands = [
  { label: 'Low',       range: '0–2',  color: '#4caf50', textColor: '#fff' },
  { label: 'Moderate',  range: '3–5',  color: '#f9c74f', textColor: '#1a1a2e' },
  { label: 'High',      range: '6–7',  color: '#f77f00', textColor: '#fff' },
  { label: 'Very High', range: '8–10', color: '#e63946', textColor: '#fff' },
  { label: 'Extreme',   range: '11+',  color: '#7b2d8b', textColor: '#fff' },
]

// --- Clothing items per UV level ---
const clothingByLevel = {
  Low: [
    { icon: '👕', name: 'Light T-shirt',   reason: 'Short sleeves are fine at low UV. Any light fabric is suitable.' },
    { icon: '👖', name: 'Casual Pants or Shorts', reason: 'No special UV protection needed — wear what is comfortable.' },
    { icon: '🧴', name: 'SPF 30 Sunscreen', reason: 'Apply if you plan to be outside for more than 30 minutes.' },
  ],
  Moderate: [
    { icon: '🕶️', name: 'Sunglasses',       reason: 'Protects eyes from moderate UV exposure.' },
    { icon: '🧢', name: 'Hat',               reason: 'A broad-brim hat shields your face, neck, and ears.' },
    { icon: '👕', name: 'Light Long-sleeve Shirt', reason: 'A breathable long-sleeve adds UV coverage without overheating.' },
    { icon: '👖', name: 'Light Pants or Trousers', reason: 'Covers legs from prolonged moderate UV exposure.' },
    { icon: '🧴', name: 'SPF 30+ Sunscreen', reason: 'Apply 20 minutes before going out and reapply after 2 hours.' },
  ],
  High: [
    { icon: '🕶️', name: 'Sunglasses',             reason: 'High UV — eyes are vulnerable without UV400 protection.' },
    { icon: '🧢', name: 'Wide-brim Hat',           reason: 'Protects face, neck, and ears — areas frequently missed by sunscreen.' },
    { icon: '👕', name: 'UV-protective Shirt (UPF 30+)', reason: 'A UPF-rated shirt blocks most UV — choose light-coloured, tightly woven fabric.' },
    { icon: '👖', name: 'Long Pants or Trousers',  reason: 'Covers legs from high UV radiation during extended outdoor time.' },
    { icon: '🧴', name: 'SPF 50+ Sunscreen',       reason: 'Apply generously to all exposed skin; reapply every 2 hours.' },
    { icon: '🌳', name: 'Seek Shade 10am–3pm',     reason: 'UV peaks at midday. Move into shade for breaks throughout the day.' },
  ],
  'Very High': [
    { icon: '🕶️', name: 'Sunglasses (UV400)',      reason: 'Very high UV causes rapid eye damage — wrap-around style preferred.' },
    { icon: '🧢', name: 'Wide-brim Hat',           reason: 'Essential at this level. A wide brim protects neck and ears too.' },
    { icon: '👔', name: 'Sun-proof Long-sleeve Coat or Shirt (UPF 50+)', reason: 'A UPF 50+ rated shirt or jacket blocks 98% of UV radiation.' },
    { icon: '👖', name: 'Long Pants or Trousers',  reason: 'Full leg coverage is strongly recommended at very high UV.' },
    { icon: '🧴', name: 'SPF 50+ Sunscreen',       reason: 'Apply every 90 minutes or immediately after swimming or sweating.' },
    { icon: '🌳', name: 'Avoid 10am–3pm Outdoors', reason: 'Stay indoors or in full shade during peak UV hours.' },
  ],
  Extreme: [
    { icon: '🚫', name: 'Avoid Outdoor Activity',  reason: 'Extreme UV can cause skin damage within minutes. Stay indoors if possible.' },
    { icon: '🕶️', name: 'Sunglasses (UV400)',      reason: 'Wrap-around UV400 sunglasses are non-negotiable at this level.' },
    { icon: '🧢', name: 'Wide-brim Hat',           reason: 'A full-coverage wide-brim hat is essential if going outside.' },
    { icon: '👔', name: 'Full Sun-proof Coat (UPF 50+)', reason: 'A UPF 50+ long-sleeve coat is the strongest clothing protection available.' },
    { icon: '👖', name: 'Long Pants or Trousers (UPF rated)', reason: 'Cover all leg skin with UV-protective fabric — shorts are not suitable.' },
    { icon: '🧴', name: 'SPF 50+ Sunscreen',       reason: 'Apply heavily to any exposed skin; reapply every 60 minutes.' },
  ],
}

// --- History helpers ---
function uviColor(uvi) {
  if (uvi <= 2)  return '#4caf50'
  if (uvi <= 5)  return '#f9c74f'
  if (uvi <= 7)  return '#f77f00'
  if (uvi <= 10) return '#e63946'
  return '#7b2d8b'
}

const comparisonClass = computed(() => {
  const ref2024 = historyData.value?.sameHour2024?.avg_uvi
  if (ref2024 == null || uvIndex.value == null) return 'text-bg-secondary'
  const diff = uvIndex.value - ref2024
  if (diff > 1)  return 'text-bg-danger'
  if (diff < -1) return 'text-bg-success'
  return 'text-bg-primary'
})

const comparisonText = computed(() => {
  const ref2024 = historyData.value?.sameHour2024?.avg_uvi
  if (ref2024 == null || uvIndex.value == null) return ''
  const diff = uvIndex.value - ref2024
  if (diff > 1)  return '▲ Higher than 2024'
  if (diff < -1) return '▼ Lower than 2024'
  return '● Similar to 2024'
})

// --- Computed UV info ---
const uvInfo = computed(() => {
  const uv = uvIndex.value ?? 0
  let band
  if (uv <= 2)      band = uvBands[0]
  else if (uv <= 5) band = uvBands[1]
  else if (uv <= 7) band = uvBands[2]
  else if (uv <= 10) band = uvBands[3]
  else              band = uvBands[4]

  const messages = {
    Low:       'Low UV today. You can enjoy being outdoors. Sunglasses are still a good idea.',
    Moderate:  'Moderate UV. Wear a hat, sunglasses, and apply sunscreen if you are outside for more than 30 minutes.',
    High:      'High UV — skin damage starts in as little as 25 minutes. Apply SPF 50+ and seek shade at midday.',
    'Very High': 'Very high UV — unprotected skin can burn within 15 minutes. Cover up and limit time outdoors.',
    Extreme:   'Extreme UV — avoid outdoor activities if possible. If you must go out, use maximum protection.',
  }

  const gradients = {
    Low:       'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
    Moderate:  'linear-gradient(135deg, #b5830a 0%, #f9c74f 100%)',
    High:      'linear-gradient(135deg, #9c4a00 0%, #f77f00 100%)',
    'Very High': 'linear-gradient(135deg, #8b0000 0%, #e63946 100%)',
    Extreme:   'linear-gradient(135deg, #3d0042 0%, #7b2d8b 100%)',
  }

  return {
    label:    band.label,
    color:    band.color,
    gradient: gradients[band.label],
    message:  messages[band.label],
    clothing: clothingByLevel[band.label],
  }
})

// --- API helpers ---
async function fetchHistory() {
  if (onHistoryCooldown.value) return
  historyLoading.value = true
  historyData.value = null
  startHistoryCooldown()
  try {
    const now       = new Date()
    const month     = now.getMonth() + 1
    const day       = now.getDate()
    const hour      = now.getHours()
    const hourLabel = `${String(hour).padStart(2, '0')}:00`

    const { data: hourRow, error: hourErr } = await supabase
      .from('uv_melbourne_2024')
      .select('date, hour, avg_uvi')
      .eq('month', month)
      .eq('day', day)
      .eq('hour', hour)
      .maybeSingle()

    if (hourErr) throw new Error(hourErr.message)

    historyData.value = {
      available:    true,
      city:         'Melbourne',
      today:        { month, day, hour, hourLabel },
      sameHour2024: hourRow
        ? { date: hourRow.date, hour: hourRow.hour, hourLabel, avg_uvi: hourRow.avg_uvi }
        : null
    }
  } catch (e) {
    historyData.value = { available: false, message: `Failed to load history: ${e.message}` }
  } finally {
    historyLoading.value = false
  }
}

async function fetchUVByCoords(lat, lon) {
  const res = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
    params: { lat, lon, exclude: 'minutely,hourly,daily,alerts', appid: API_KEY, units: 'metric' }
  })
  return { uvi: res.data.current.uvi, temp: res.data.current.temp }
}

async function reverseGeocode(lat, lon) {
  const res = await axios.get('https://api.openweathermap.org/geo/1.0/reverse', {
    params: { lat, lon, limit: 1, appid: API_KEY }
  })
  const place = res.data[0]
  return place ? `${place.name}, ${place.state ?? place.country}` : 'Unknown location'
}

async function forwardGeocode(city) {
  const res = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
    params: { q: city, limit: 1, appid: API_KEY }
  })
  if (!res.data.length) throw new Error(`No results found for "${city}". Try a different name.`)
  return res.data[0]
}

// --- Actions ---
async function getByGeolocation() {
  if (onCooldown.value) return
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by your browser. Please search for a city instead.'
    return
  }
  loading.value = true
  error.value = ''
  historyData.value = null
  startCooldown()
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const [weather, name] = await Promise.all([
          fetchUVByCoords(latitude, longitude),
          reverseGeocode(latitude, longitude)
        ])
        uvRaw.value       = weather.uvi
        uvIndex.value     = Math.round(weather.uvi)
        temperature.value = Math.round(weather.temp)
        locationName.value = name
        lastUpdated.value = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
      } catch {
        error.value = 'Unable to retrieve UV data. Please check your API key or try again.'
      } finally {
        loading.value = false
      }
    },
    () => {
      loading.value = false
      showSearch.value = true
      error.value = ''
    }
  )
}

async function searchByCity() {
  if (!cityInput.value.trim() || onCooldown.value) return
  loading.value = true
  error.value = ''
  showSearch.value = false
  historyData.value = null
  startCooldown()
  try {
    const place = await forwardGeocode(cityInput.value.trim())
    const weather = await fetchUVByCoords(place.lat, place.lon)
    uvRaw.value       = weather.uvi
    uvIndex.value     = Math.round(weather.uvi)
    temperature.value = Math.round(weather.temp)
    locationName.value = `${place.name}, ${place.state ?? place.country}`
    lastUpdated.value = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    cityInput.value = ''
  } catch (e) {
    error.value = e.message || 'Unable to retrieve UV data. Please try again.'
  } finally {
    loading.value = false
  }
}

function init() {
  error.value = ''
  getByGeolocation()
}
</script>

<style scoped>
/* ── UV Hero ─────────────────────────────────────────────────────── */
.uv-hero {
  border-radius: var(--radius);
  padding: 2.5rem 2rem;
  color: #fff;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.uv-number {
  font-size: 5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
}

.uv-label {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.9;
}

.uv-message {
  margin-top: 0.85rem;
  font-size: 1rem;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.92;
  line-height: 1.55;
}

.raw-data-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.raw-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.raw-icon   { font-size: 1.1rem; flex-shrink: 0; }
.raw-value  { font-size: 0.95rem; font-weight: 700; color: #fff; line-height: 1.2; }
.location-raw { font-size: 0.78rem; word-break: break-word; }
.raw-key    { font-size: 0.65rem; opacity: 0.75; color: #fff; margin-top: 1px; }

.raw-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.uv-band {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 5px;
  opacity: 0.6;
}

/* ── UV Scale ────────────────────────────────────────────────────── */
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
  padding: 0.55rem 0.25rem;
  opacity: 0.45;
  transition: opacity var(--transition);
}

.scale-segment.active { opacity: 1; }
.scale-range  { font-size: 0.7rem; font-weight: 700; color: #fff; }
.scale-label  { font-size: 0.62rem; font-weight: 500; color: rgba(255,255,255,0.85); margin-top: 2px; }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .uv-number   { font-size: 4rem; }
  .uv-label    { font-size: 1.2rem; }
  .scale-label { display: none; }
}
</style>
