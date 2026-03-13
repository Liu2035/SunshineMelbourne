<template>
  <div class="uv-today">

    <!-- Location bar (only shown after first load) -->
    <template v-if="uvIndex !== null">
      <div class="location-bar">
        <span class="location-icon">📍</span>
        <span class="location-name">{{ locationName }}</span>
        <button
          class="change-btn"
          :disabled="onCooldown"
          @click="showSearch = !showSearch"
        >
          {{ showSearch ? 'Cancel' : (onCooldown ? `${cooldownRemaining}s` : 'Change') }}
        </button>
      </div>

      <!-- Manual city search (change location) -->
      <form v-if="showSearch" class="search-form" @submit.prevent="searchByCity">
        <input
          v-model="cityInput"
          type="text"
          placeholder="Enter suburb or city (e.g. Melbourne)"
          class="city-input"
          autocomplete="off"
        />
        <button
          type="submit"
          class="search-btn"
          :disabled="!cityInput.trim() || onCooldown"
        >
          Search
        </button>
      </form>
    </template>

    <!-- Loading state -->
    <div v-if="loading" class="state-card">
      <div class="spinner"></div>
      <p>Fetching UV data…</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="state-card error-card">
      <span class="state-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="retry-btn" :disabled="onCooldown" @click="init">
        {{ onCooldown ? `Try again in ${cooldownRemaining}s` : 'Try again' }}
      </button>
    </div>

    <!-- No location yet — show both options immediately -->
    <div v-else-if="uvIndex === null" class="prompt-panel">
      <div class="prompt-heading">Check today's UV level</div>
      <p class="prompt-desc">Use your device location or search by city.</p>

      <button
        class="locate-btn"
        :disabled="onCooldown"
        @click="getByGeolocation"
      >
        {{ onCooldown ? `Please wait ${cooldownRemaining}s` : 'Use my location' }}
      </button>

      <div class="prompt-divider"><span>or</span></div>

      <form class="search-form-inline" @submit.prevent="searchByCity">
        <input
          v-model="cityInput"
          type="text"
          placeholder="Enter suburb or city (e.g. Melbourne)"
          class="city-input"
          autocomplete="off"
        />
        <button
          type="submit"
          class="search-btn"
          :disabled="!cityInput.trim() || onCooldown"
        >
          {{ onCooldown ? `${cooldownRemaining}s` : 'Search' }}
        </button>
      </form>
    </div>

    <!-- UV data loaded -->
    <template v-else>
      <!-- UV Hero card -->
      <div class="uv-hero" :style="{ background: uvInfo.gradient }">
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

      <!-- Clothing recommendations -->
      <section class="clothing-section">
        <h2 class="section-title">What to Wear Today</h2>
        <p class="section-sub">Recommended for UV Index {{ uvIndex }} ({{ uvInfo.label }})</p>
        <div class="clothing-grid">
          <div
            v-for="item in uvInfo.clothing"
            :key="item.name"
            class="clothing-card"
          >
            <div class="clothing-icon">{{ item.icon }}</div>
            <div class="clothing-info">
              <div class="clothing-name">{{ item.name }}</div>
              <div class="clothing-reason">{{ item.reason }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Historical comparison -->
      <div v-if="historyData?.available" class="history-card">
        <div class="history-header">
          <span class="history-icon">📅</span>
          <div>
            <div class="history-title">Historical Average for {{ historyData.city }}</div>
            <div class="history-sub">Typical UV in {{ currentMonthLabel }}</div>
          </div>
          <div class="history-avg" :style="{ color: avgUviColor }">
            {{ historyData.thisMonthAvg }}
          </div>
        </div>
        <div class="history-comparison" v-if="historyData.thisMonthAvg !== null">
          <span
            class="comparison-badge"
            :class="comparisonClass"
          >{{ comparisonText }}</span>
          <span class="comparison-detail">
            Today's UV ({{ uvIndex }}) vs. {{ currentMonthLabel }} average ({{ historyData.thisMonthAvg }})
          </span>
        </div>
        <div class="history-bar-row">
          <div
            v-for="h in historyData.history"
            :key="h.month"
            class="history-bar-col"
            :class="{ 'current-month': h.month === historyData.currentMonth }"
          >
            <div class="bar-wrap">
              <div
                class="bar-fill"
                :style="{ height: barHeight(h.avg_uvi) + '%', background: uviColor(h.avg_uvi) }"
              ></div>
            </div>
            <span class="bar-label">{{ h.label }}</span>
          </div>
        </div>
        <p class="history-note">
          Source: ARPANSA / Data.gov.au — monthly average UV index for 8 Australian capital cities
          (CC BY 2.5 AU)
        </p>
      </div>

      <!-- Last updated -->
      <p class="last-updated">Last updated: {{ lastUpdated }}</p>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, toRefs, onUnmounted } from 'vue'
import axios from 'axios'
import { uvStore } from '@/stores/uvStore.js'

const API_KEY = import.meta.env.VITE_OWM_API_KEY

// --- Persistent state (survives navigation via shared store) ---
const { uvIndex, uvRaw, temperature, locationName, lastUpdated, historyData } = toRefs(uvStore)

// --- Local-only state ---
const loading    = ref(false)
const error      = ref('')
const showSearch = ref(false)
const cityInput  = ref('')

// --- Cooldown (10 s between API calls) ---
const COOLDOWN_SEC     = 10
const cooldownRemaining = ref(0)
const onCooldown       = computed(() => cooldownRemaining.value > 0)
let _cooldownTimer     = null

function startCooldown() {
  cooldownRemaining.value = COOLDOWN_SEC
  clearInterval(_cooldownTimer)
  _cooldownTimer = setInterval(() => {
    cooldownRemaining.value -= 1
    if (cooldownRemaining.value <= 0) clearInterval(_cooldownTimer)
  }, 1000)
}

onUnmounted(() => clearInterval(_cooldownTimer))

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
const MONTH_LABELS = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December']
const currentMonthLabel = MONTH_LABELS[new Date().getMonth()]

const MAX_UVI = 14

function barHeight(uvi) {
  return Math.round((uvi / MAX_UVI) * 100)
}

function uviColor(uvi) {
  if (uvi <= 2)  return '#4caf50'
  if (uvi <= 5)  return '#f9c74f'
  if (uvi <= 7)  return '#f77f00'
  if (uvi <= 10) return '#e63946'
  return '#7b2d8b'
}

const avgUviColor = computed(() =>
  historyData.value?.thisMonthAvg != null
    ? uviColor(historyData.value.thisMonthAvg)
    : '#999'
)

const comparisonClass = computed(() => {
  if (!historyData.value?.thisMonthAvg || uvIndex.value == null) return ''
  const diff = uvIndex.value - historyData.value.thisMonthAvg
  if (diff > 1)  return 'badge-above'
  if (diff < -1) return 'badge-below'
  return 'badge-typical'
})

const comparisonText = computed(() => {
  if (!historyData.value?.thisMonthAvg || uvIndex.value == null) return ''
  const diff = uvIndex.value - historyData.value.thisMonthAvg
  if (diff > 1)  return '▲ Above average'
  if (diff < -1) return '▼ Below average'
  return '● Typical for this month'
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
async function fetchHistory(cityName) {
  try {
    const res = await axios.get(`/api/uv-history?city=${encodeURIComponent(cityName)}`)
    historyData.value = res.data
  } catch {
    historyData.value = null
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
        await fetchHistory(name)
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
    await fetchHistory(place.name)
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
.uv-today {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Location bar */
.location-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.65rem 1rem;
}

.location-icon { font-size: 1rem; }

.location-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
}

.location-name.muted {
  color: var(--text-secondary);
  font-weight: 400;
}

.change-btn {
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  transition: background var(--transition);
}

.change-btn:hover { background: var(--border); }

/* Search form */
.search-form {
  display: flex;
  gap: 0.5rem;
}

.city-input {
  flex: 1;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  outline: none;
  transition: border-color var(--transition);
}

.city-input:focus { border-color: var(--color-high); }

.search-btn {
  padding: 0.65rem 1.2rem;
  background: var(--color-high);
  color: #fff;
  font-weight: 600;
  border-radius: var(--radius);
  transition: opacity var(--transition);
}

.search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.search-btn:not(:disabled):hover { opacity: 0.85; }

/* State cards */
.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-align: center;
  color: var(--text-secondary);
}

.state-icon { font-size: 2.5rem; }

.error-card { border-color: #fbc4c4; background: #fff5f5; }
.error-card p { color: #c0392b; }

.retry-btn, .locate-btn {
  padding: 0.65rem 1.4rem;
  border-radius: var(--radius);
  font-weight: 600;
  background: var(--nav-bg);
  color: #fff;
  transition: opacity var(--transition);
}

.retry-btn:hover:not(:disabled),
.locate-btn:hover:not(:disabled) { opacity: 0.82; }

.retry-btn:disabled,
.locate-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* Prompt panel (initial state) */
.prompt-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.prompt-heading {
  font-size: 1.1rem;
  font-weight: 700;
}

.prompt-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: -0.35rem;
}

.prompt-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.prompt-divider::before,
.prompt-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.search-form-inline {
  display: flex;
  gap: 0.5rem;
}

/* Spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--color-high);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* UV Hero */
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
  background: rgba(0,0,0,0.18);
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

.raw-icon { font-size: 1.1rem; flex-shrink: 0; }

.raw-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.location-raw {
  font-size: 0.78rem;
  word-break: break-word;
}

.raw-key {
  font-size: 0.65rem;
  opacity: 0.75;
  color: #fff;
  margin-top: 1px;
}

.raw-divider {
  width: 1px;
  height: 36px;
  background: rgba(255,255,255,0.25);
  flex-shrink: 0;
}

.uv-band {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 5px;
  opacity: 0.6;
}

/* UV Scale */
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

.scale-segment.active {
  opacity: 1;
}

.scale-range {
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
}

.scale-label {
  font-size: 0.62rem;
  font-weight: 500;
  color: rgba(255,255,255,0.85);
  margin-top: 2px;
}

/* Clothing section */
.clothing-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.section-sub {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
}

.clothing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.clothing-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.85rem;
}

.clothing-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
  line-height: 1;
}

.clothing-name {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.clothing-reason {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Historical comparison card */
.history-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.history-icon { font-size: 1.5rem; flex-shrink: 0; }

.history-title {
  font-weight: 700;
  font-size: 1rem;
}

.history-sub {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.history-avg {
  margin-left: auto;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

.history-comparison {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.comparison-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
}

.badge-above   { background: #fde8e8; color: #c0392b; }
.badge-below   { background: #e8f5e9; color: #2e7d32; }
.badge-typical { background: #e3f2fd; color: #1565c0; }

.comparison-detail {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

/* Monthly bar chart */
.history-bar-row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 80px;
}

.history-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.history-bar-col.current-month .bar-label {
  font-weight: 700;
  color: var(--text-primary);
}

.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  border-radius: 3px 3px 0 0;
  min-height: 3px;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 0.6rem;
  color: var(--text-secondary);
}

.history-note {
  font-size: 0.72rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
}

/* Last updated */
.last-updated {
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: right;
}

@media (max-width: 480px) {
  .uv-number { font-size: 4rem; }
  .uv-label  { font-size: 1.2rem; }
  .clothing-grid { grid-template-columns: 1fr; }
  .scale-label { display: none; }
}
</style>
