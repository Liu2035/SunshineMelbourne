<template>
  <div class="d-flex flex-column gap-4">

    <!-- Header / Banner -->
    <div class="card shadow-sm border-0 bg-dark text-white p-4 rounded-3" style="background: linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%);">
      <div class="d-flex align-items-center gap-3">
        <span class="fs-1">☀️</span>
        <div>
          <h1 class="h4 fw-bold mb-1">Sun Safety &amp; UV Awareness</h1>
          <p class="text-white-50 mb-0 small" style="max-width: 650px;">
            Evidence-based Australian cancer statistics, capital cities UV climate comparisons, and personalized Fitzpatrick skin-type absorption guidance.
          </p>
        </div>
      </div>
    </div>

    <!-- ── US2.1:  1 — Australian Melanoma Trends ─────── -->
    <section class="card shadow-sm border-0">
      <div class="card-body p-4">
        <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h2 class="h5 fw-bold mb-1">📈  1: Australian Melanoma Trends (1982–2020)</h2>
            <p class="text-muted small mb-0">Age-standardised incidence and mortality rates per 100,000 population in Australia.</p>
          </div>
          <div class="d-flex gap-2">
            <span class="badge d-flex align-items-center gap-1 text-white px-2.5 py-1" style="background: #e63946">
              <span class="legend-dot bg-white"></span> Incidence Rate (Per 100k)
            </span>
            <span class="badge d-flex align-items-center gap-1 text-white px-2.5 py-1" style="background: #457b9d">
              <span class="legend-dot bg-white"></span> Mortality Rate (Per 100k)
            </span>
          </div>
        </div>

        <!-- SVG Line Chart with Tooltip -->
        <div class="chart-wrapper position-relative" @mouseleave="hoveredPoint = null">
          <svg class="w-100 h-100" viewBox="0 0 700 280" preserveAspectRatio="none">
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e63946" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#e63946" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Grid lines & Y-axis labels -->
            <g class="grid-lines" stroke="#e2ddd6" stroke-dasharray="3 3">
              <line x1="50" y1="30" x2="680" y2="30" />
              <line x1="50" y1="90" x2="680" y2="90" />
              <line x1="50" y1="150" x2="680" y2="150" />
              <line x1="50" y1="210" x2="680" y2="210" />
              <line x1="50" y1="250" x2="680" y2="250" stroke="#b0a89e" stroke-dasharray="0" />
            </g>

            <g class="y-labels" fill="#6c757d" font-size="11" text-anchor="end">
              <text x="44" y="34">60</text>
              <text x="44" y="94">45</text>
              <text x="44" y="154">30</text>
              <text x="44" y="214">15</text>
              <text x="44" y="254">0</text>
            </g>

            <!-- Incidence Area fill -->
            <path :d="incidenceAreaPath" fill="url(#incGrad)" />

            <!-- Incidence Line -->
            <path :d="incidenceLinePath" fill="none" stroke="#e63946" stroke-width="3" stroke-linecap="round" />

            <!-- Mortality Line -->
            <path :d="mortalityLinePath" fill="none" stroke="#457b9d" stroke-width="3" stroke-linecap="round" />

            <!-- Data Points -->
            <g v-for="(pt, idx) in cancerChartPoints" :key="'inc-' + pt.year">
              <circle
                :cx="pt.x"
                :cy="pt.incY"
                r="5"
                fill="#e63946"
                stroke="#fff"
                stroke-width="2"
                class="chart-circle"
                @mouseenter="hoveredPoint = { ...pt, type: 'inc' }"
              />
              <circle
                :cx="pt.x"
                :cy="pt.mortY"
                r="4.5"
                fill="#457b9d"
                stroke="#fff"
                stroke-width="2"
                class="chart-circle"
                @mouseenter="hoveredPoint = { ...pt, type: 'mort' }"
              />
              <!-- Year X-Labels -->
              <text
                v-if="idx % 2 === 0 || idx === cancerChartPoints.length - 1"
                :x="pt.x"
                y="270"
                fill="#6c757d"
                font-size="11"
                text-anchor="middle"
              >
                {{ pt.year }}
              </text>
            </g>

            <!-- Hover vertical indicator -->
            <line
              v-if="hoveredPoint"
              :x1="hoveredPoint.x"
              y1="30"
              :x2="hoveredPoint.x"
              y2="250"
              stroke="#1a1a2e"
              stroke-width="1.5"
              stroke-dasharray="4 4"
            />
          </svg>

          <!-- Interactive Tooltip (AC2.1.2) -->
          <div
            v-if="hoveredPoint"
            class="chart-tooltip shadow-sm"
            :style="{ left: Math.min(520, Math.max(70, (hoveredPoint.x / 700) * 100)) + '%', top: '25px' }"
          >
            <div class="fw-bold border-bottom pb-1 mb-1 text-dark">Year {{ hoveredPoint.year }}</div>
            <div class="d-flex justify-content-between gap-3 text-danger small">
              <span>Incidence:</span>
              <strong>{{ hoveredPoint.incidence_rate }} / 100k</strong>
            </div>
            <div class="d-flex justify-content-between gap-3 text-primary small">
              <span>Mortality:</span>
              <strong>{{ hoveredPoint.mortality_rate }} / 100k</strong>
            </div>
            <div class="d-flex justify-content-between gap-3 text-muted small mt-1 pt-1 border-top" style="font-size: 0.72rem">
              <span>New cases:</span>
              <span>{{ hoveredPoint.new_cases.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Y-Axis Label Note -->
        <div class="d-flex align-items-center justify-content-between mt-2 flex-wrap text-muted small" style="font-size: 0.74rem">
          <span>Y-Axis: Rate per 100,000 persons | X-Axis: Calendar Year</span>
          <span>Source: Australian Institute of Health and Welfare (AIHW) 2023, CC BY 3.0 AU</span>
        </div>

        <!-- Youth Callout Insight -->
        <div class="p-3 rounded-3 mt-3 d-flex align-items-start gap-3" style="background: #fff3cd; border-left: 4px solid #ffc107;">
          <span class="fs-4">⚠️</span>
          <div style="font-size: 0.88rem">
            <strong>Key Gen Z Insight:</strong> Melanoma is the single most common cancer diagnosed in Australians aged 15–29, accounting for over <strong>15% of all adolescent &amp; young adult cancers</strong>. A severe sunburn during childhood or teen years doubles the risk of melanoma later in life.
          </div>
        </div>
      </div>
    </section>

    <!-- ── US2.1:  2 — Australian Capital Cities UV Comparison -->
    <section class="card shadow-sm border-0">
      <div class="card-body p-4">
        <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h2 class="h5 fw-bold mb-1">☀️  2: Australian Capital Cities Monthly UV Comparison</h2>
            <p class="text-muted small mb-0">Compare Melbourne's seasonal UV swing against Sydney, Brisbane, and Darwin (ARPANSA monitoring network).</p>
          </div>
          <!-- City toggles -->
          <div class="d-flex flex-wrap gap-1">
            <button
              v-for="city in cityKeys"
              :key="city.id"
              class="btn btn-sm py-1 px-2.5 rounded-pill fw-semibold"
              :class="selectedCity === city.id ? 'btn-dark' : 'btn-outline-secondary'"
              style="font-size: 0.78rem"
              @click="selectedCity = city.id"
            >
              {{ city.name }}
            </button>
          </div>
        </div>

        <!-- City Comparison Bar & Curve Chart -->
        <div class="city-chart-container position-relative" @mouseleave="hoveredMonth = null">
          <div class="d-flex align-items-end justify-content-between h-100 gap-1 pt-3 pb-2 border-bottom">
            <div
              v-for="(item, idx) in currentCityMonthlyData"
              :key="item.month"
              class="city-month-col d-flex flex-column align-items-center h-100 justify-content-end"
              @mouseenter="hoveredMonth = item"
            >
              <span class="city-val-tag" :style="{ color: uviColor(item.avg_uvi) }">{{ item.avg_uvi }}</span>
              <div class="city-bar-track">
                <div
                  class="city-bar-fill"
                  :style="{
                    height: Math.min(100, (item.avg_uvi / 13) * 100) + '%',
                    background: uviColor(item.avg_uvi)
                  }"
                ></div>
              </div>
              <span class="city-month-name">{{ item.label }}</span>
            </div>
          </div>

          <!-- Tooltip for hovered month -->
          <div
            v-if="hoveredMonth"
            class="city-tooltip shadow-sm"
          >
            <div class="fw-bold">{{ selectedCityLabel }} — {{ hoveredMonth.label }}</div>
            <div class="small mt-1">Average UV Index: <strong>{{ hoveredMonth.avg_uvi }}</strong> ({{ getUVBandLabel(hoveredMonth.avg_uvi) }})</div>
            <div class="text-muted small" style="font-size: 0.74rem">Peak midday readings regularly reach {{ (hoveredMonth.avg_uvi * 1.35).toFixed(1) }}+</div>
          </div>
        </div>

        <div class="d-flex align-items-center justify-content-between mt-2 flex-wrap text-muted small" style="font-size: 0.74rem">
          <span>Y-Axis: Monthly Mean UV Index | X-Axis: Month of Year</span>
          <span>Source: ARPANSA / Data.gov.au UV Radiation Monitoring Network (CC BY 2.5 AU)</span>
        </div>

        <!-- Comparison Takeaway -->
        <div class="p-3 rounded-3 mt-3 d-flex align-items-start gap-2.5" style="background: var(--bg); border: 1px solid var(--border)">
          <span class="fs-5">💡</span>
          <div class="small">
            <strong>Why Melbourne's UV is Deceptive:</strong> In Melbourne, winter UV averages just <strong>1.9</strong>, causing many young adults to forget sun-safety habits. Come December and January, UV spikes to an average of <strong>8.2 with midday peaks regularly exceeding 11+</strong>. High temperatures and UV do not always correlate: <strong>you can get severely burned on a cool, overcast 21°C summer day</strong>.
          </div>
        </div>
      </div>
    </section>

    <!-- ── US2.2: Skin Colour and UV Absorption Guide (Fitzpatrick Scale) -->
    <section class="card shadow-sm border-0" id="skin-guide">
      <div class="card-body p-4 d-flex flex-column gap-4">
        <div>
          <div class="d-flex align-items-center gap-2">
            <span class="fs-4">🧬</span>
            <h2 class="h5 fw-bold mb-0"> Skin Colour &amp; UV Absorption Guide</h2>
          </div>
          <p class="text-muted small mb-0 mt-1">
            Understand how melanin concentration affects UV radiation absorption, personal burn times, and preventative sun protection.
          </p>
        </div>

        <!-- Initial Prompt when not yet selected (AC2.2.3) -->
        <div v-if="!selectedSkinType" class="alert alert-info d-flex align-items-center gap-2 mb-0">
          <span>👉</span>
          <span class="fw-semibold small">Please select your Fitzpatrick Skin Type below to view your personalized UV absorption &amp; burn risk calculation:</span>
        </div>

        <!-- Skin Type Selector Buttons (Fitzpatrick I-VI) -->
        <div>
          <label class="form-label text-uppercase fw-bold text-muted small mb-2" style="letter-spacing: 0.5px">
            Select Fitzpatrick Skin Type (I – VI):
          </label>
          <div class="row g-2">
            <div v-for="st in fitzpatrickTypes" :key="st.type" class="col-6 col-md-4">
              <button
                class="btn w-100 p-2.5 text-start border rounded-3 skin-type-btn d-flex align-items-center gap-2.5 h-100"
                :class="{ active: selectedSkinType?.type === st.type }"
                @click="selectedSkinType = st"
              >
                <div class="skin-swatch shadow-sm" :style="{ background: st.colorCode }"></div>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="fw-bold" style="font-size: 0.84rem">{{ st.type }}: {{ st.title }}</div>
                  <div class="text-muted text-truncate" style="font-size: 0.72rem">{{ st.reaction }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Personalized UV Absorption Output (AC2.2.1, AC2.2.2) -->
        <div v-if="selectedSkinType" class="personalized-card p-4 rounded-3 text-dark border" :style="{ borderColor: selectedSkinType.accentColor, background: '#faf9f6' }">
          <div class="d-flex align-items-start justify-content-between flex-wrap gap-3 pb-3 border-bottom">
            <div class="d-flex align-items-center gap-3">
              <div class="skin-swatch-lg" :style="{ background: selectedSkinType.colorCode }"></div>
              <div>
                <span class="badge mb-1 text-white px-2 py-1" :style="{ background: selectedSkinType.accentColor }">
                  Fitzpatrick {{ selectedSkinType.type }}
                </span>
                <h3 class="h5 fw-bold mb-0">{{ selectedSkinType.title }} — {{ selectedSkinType.description }}</h3>
              </div>
            </div>

            <!-- UV interactive slider for testing -->
            <div class="d-flex align-items-center gap-2 bg-white px-3 py-1.5 border rounded-pill shadow-sm">
              <span class="small fw-semibold text-muted">Test UV:</span>
              <input
                type="range"
                min="1"
                max="13"
                step="1"
                v-model.number="testUV"
                class="form-range"
                style="width: 100px;"
              />
              <span class="badge fw-bold" :style="{ background: uviColor(testUV), color: '#fff' }">UV {{ testUV }}</span>
            </div>
          </div>

          <!-- Dynamic Burn Time & Melanin Mechanics -->
          <div class="row g-3 mt-2">
            <div class="col-md-4">
              <div class="p-3 bg-white border rounded-3 text-center h-100 shadow-sm d-flex flex-column justify-content-center">
                <span class="text-muted small text-uppercase fw-bold" style="font-size: 0.7rem">Approximate Burn Time</span>
                <div class="fw-bold fs-3 my-1" :style="{ color: calculatedBurnTimeColor }">
                  {{ calculatedBurnTime }}
                </div>
                <span class="text-muted" style="font-size: 0.72rem">at current UV Index {{ testUV }}</span>
              </div>
            </div>

            <div class="col-md-4">
              <div class="p-3 bg-white border rounded-3 h-100 shadow-sm">
                <span class="text-muted small text-uppercase fw-bold" style="font-size: 0.7rem">UV Absorption &amp; Melanin</span>
                <p class="mt-1 mb-0 small" style="line-height: 1.4">
                  {{ selectedSkinType.melaninExplanation }}
                </p>
              </div>
            </div>

            <div class="col-md-4">
              <div class="p-3 bg-white border rounded-3 h-100 shadow-sm">
                <span class="text-muted small text-uppercase fw-bold" style="font-size: 0.7rem">Personalized Protection Strategy</span>
                <p class="mt-1 mb-0 small fw-semibold" style="line-height: 1.4; color: var(--text-primary)">
                  {{ selectedSkinType.recommendation }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Gen Z & Alpha Sun-Safety Myth Busters ─────────────────── -->
        <div class="mt-2">
          <h3 class="h6 fw-bold mb-3 d-flex align-items-center gap-2">
            <span>🛡️</span> Debunking Viral Social Media Tanning Myths
          </h3>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="card h-100 border p-3" style="background: #fff">
                <div class="d-flex align-items-center gap-2 text-danger fw-bold small mb-1">
                  <span>❌</span> Myth: "A 'base tan' prevents future sunburn."
                </div>
                <p class="text-muted small mb-0" style="line-height: 1.45">
                  <strong>Fact:</strong> A tan is a sign of cellular DNA mutation and distress, offering negligible protection (equivalent to SPF 2–4 at best). Any intentional tanning substantially accelerates melanoma risk.
                </p>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card h-100 border p-3" style="background: #fff">
                <div class="d-flex align-items-center gap-2 text-danger fw-bold small mb-1">
                  <span>❌</span> Myth: "People with darker skin don't need sunscreen."
                </div>
                <p class="text-muted small mb-0" style="line-height: 1.45">
                  <strong>Fact:</strong> While eumelanin offers partial UV filtering, skin cancer in darker skin tones (like acral lentiginous melanoma) is often diagnosed at much later, deadlier stages. Everyone needs sun protection.
                </p>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card h-100 border p-3" style="background: #fff">
                <div class="d-flex align-items-center gap-2 text-danger fw-bold small mb-1">
                  <span>❌</span> Myth: "You won't burn if it's cloudy or cool."
                </div>
                <p class="text-muted small mb-0" style="line-height: 1.45">
                  <strong>Fact:</strong> UV radiation cannot be felt as heat (infrared is what heats you up). Up to 80% of UV rays penetrate cloud cover and reflect off water, sand, and concrete.
                </p>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card h-100 border p-3" style="background: #fff">
                <div class="d-flex align-items-center gap-2 text-danger fw-bold small mb-1">
                  <span>❌</span> Myth: "Sunscreen applied in the morning lasts all day."
                </div>
                <p class="text-muted small mb-0" style="line-height: 1.45">
                  <strong>Fact:</strong> UV filters break down under UV radiation, sweat, and contact. Sunscreen must be reapplied every 90 to 120 minutes to maintain certified SPF effectiveness.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { uvStore } from '@/stores/uvStore.js'

// ── Cancer Chart Data ─────────────────────────────────────────────
const cancerData = ref([
  { year: 1982, incidence_rate: 28.1, mortality_rate: 4.7, new_cases: 3526, deaths: 631 },
  { year: 1985, incidence_rate: 32.4, mortality_rate: 4.9, new_cases: 4310, deaths: 702 },
  { year: 1988, incidence_rate: 35.8, mortality_rate: 5.2, new_cases: 5120, deaths: 795 },
  { year: 1990, incidence_rate: 37.9, mortality_rate: 5.4, new_cases: 5780, deaths: 854 },
  { year: 1993, incidence_rate: 41.2, mortality_rate: 5.6, new_cases: 6720, deaths: 932 },
  { year: 1995, incidence_rate: 43.1, mortality_rate: 5.7, new_cases: 7240, deaths: 994 },
  { year: 1998, incidence_rate: 45.3, mortality_rate: 5.9, new_cases: 8010, deaths: 1070 },
  { year: 2000, incidence_rate: 46.8, mortality_rate: 5.9, new_cases: 8560, deaths: 1115 },
  { year: 2003, incidence_rate: 47.9, mortality_rate: 6.0, new_cases: 9280, deaths: 1198 },
  { year: 2005, incidence_rate: 49.0, mortality_rate: 6.1, new_cases: 9890, deaths: 1260 },
  { year: 2008, incidence_rate: 50.4, mortality_rate: 6.2, new_cases: 10750, deaths: 1352 },
  { year: 2010, incidence_rate: 51.2, mortality_rate: 6.1, new_cases: 11405, deaths: 1380 },
  { year: 2012, incidence_rate: 52.6, mortality_rate: 5.9, new_cases: 12150, deaths: 1410 },
  { year: 2014, incidence_rate: 53.4, mortality_rate: 5.7, new_cases: 12890, deaths: 1430 },
  { year: 2016, incidence_rate: 54.2, mortality_rate: 5.4, new_cases: 13950, deaths: 1420 },
  { year: 2018, incidence_rate: 55.1, mortality_rate: 5.1, new_cases: 14980, deaths: 1415 },
  { year: 2020, incidence_rate: 55.8, mortality_rate: 4.8, new_cases: 15840, deaths: 1390 },
])

const hoveredPoint = ref(null)

// SVG coordinates mapping (X: 60 to 670, Y: 250 (0) to 30 (60))
const cancerChartPoints = computed(() => {
  const minYear = 1982
  const maxYear = 2020
  const startX = 65
  const endX = 665
  const zeroY = 250
  const maxVal = 60

  return cancerData.value.map(d => {
    const x = startX + ((d.year - minYear) / (maxYear - minYear)) * (endX - startX)
    const incY = zeroY - (d.incidence_rate / maxVal) * (zeroY - 30)
    const mortY = zeroY - (d.mortality_rate / maxVal) * (zeroY - 30)
    return { ...d, x, incY, mortY }
  })
})

const incidenceLinePath = computed(() => {
  return cancerChartPoints.value
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.incY.toFixed(1)}`)
    .join(' ')
})

const incidenceAreaPath = computed(() => {
  if (!cancerChartPoints.value.length) return ''
  const first = cancerChartPoints.value[0]
  const last = cancerChartPoints.value[cancerChartPoints.value.length - 1]
  const linePart = incidenceLinePath.value
  return `${linePart} L ${last.x.toFixed(1)} 250 L ${first.x.toFixed(1)} 250 Z`
})

const mortalityLinePath = computed(() => {
  return cancerChartPoints.value
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.mortY.toFixed(1)}`)
    .join(' ')
})

// ── Capital Cities UV Comparison Data ─────────────────────────────
const cityKeys = [
  { id: 'melbourne', name: 'Melbourne' },
  { id: 'sydney',    name: 'Sydney' },
  { id: 'brisbane',  name: 'Brisbane' },
  { id: 'darwin',    name: 'Darwin' },
  { id: 'perth',     name: 'Perth' },
  { id: 'hobart',    name: 'Hobart' }
]
const selectedCity = ref('melbourne')
const hoveredMonth = ref(null)

const capitalCitiesData = ref({
  melbourne: [
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
  ],
  sydney: [
    { month: 1, label: 'Jan', avg_uvi: 9.2 },
    { month: 2, label: 'Feb', avg_uvi: 8.6 },
    { month: 3, label: 'Mar', avg_uvi: 7.1 },
    { month: 4, label: 'Apr', avg_uvi: 5.2 },
    { month: 5, label: 'May', avg_uvi: 3.5 },
    { month: 6, label: 'Jun', avg_uvi: 2.6 },
    { month: 7, label: 'Jul', avg_uvi: 2.9 },
    { month: 8, label: 'Aug', avg_uvi: 3.8 },
    { month: 9, label: 'Sep', avg_uvi: 5.6 },
    { month: 10, label: 'Oct', avg_uvi: 7.2 },
    { month: 11, label: 'Nov', avg_uvi: 8.7 },
    { month: 12, label: 'Dec', avg_uvi: 9.8 },
  ],
  brisbane: [
    { month: 1, label: 'Jan', avg_uvi: 10.8 },
    { month: 2, label: 'Feb', avg_uvi: 10.2 },
    { month: 3, label: 'Mar', avg_uvi: 8.9 },
    { month: 4, label: 'Apr', avg_uvi: 6.9 },
    { month: 5, label: 'May', avg_uvi: 4.8 },
    { month: 6, label: 'Jun', avg_uvi: 4.0 },
    { month: 7, label: 'Jul', avg_uvi: 4.3 },
    { month: 8, label: 'Aug', avg_uvi: 5.5 },
    { month: 9, label: 'Sep', avg_uvi: 7.4 },
    { month: 10, label: 'Oct', avg_uvi: 9.1 },
    { month: 11, label: 'Nov', avg_uvi: 10.4 },
    { month: 12, label: 'Dec', avg_uvi: 11.2 },
  ],
  darwin: [
    { month: 1, label: 'Jan', avg_uvi: 11.2 },
    { month: 2, label: 'Feb', avg_uvi: 11.0 },
    { month: 3, label: 'Mar', avg_uvi: 11.5 },
    { month: 4, label: 'Apr', avg_uvi: 10.8 },
    { month: 5, label: 'May', avg_uvi: 8.9 },
    { month: 6, label: 'Jun', avg_uvi: 8.1 },
    { month: 7, label: 'Jul', avg_uvi: 8.4 },
    { month: 8, label: 'Aug', avg_uvi: 9.9 },
    { month: 9, label: 'Sep', avg_uvi: 11.3 },
    { month: 10, label: 'Oct', avg_uvi: 12.1 },
    { month: 11, label: 'Nov', avg_uvi: 12.4 },
    { month: 12, label: 'Dec', avg_uvi: 11.8 },
  ],
  perth: [
    { month: 1, label: 'Jan', avg_uvi: 10.5 },
    { month: 2, label: 'Feb', avg_uvi: 9.8 },
    { month: 3, label: 'Mar', avg_uvi: 7.8 },
    { month: 4, label: 'Apr', avg_uvi: 5.2 },
    { month: 5, label: 'May', avg_uvi: 3.3 },
    { month: 6, label: 'Jun', avg_uvi: 2.4 },
    { month: 7, label: 'Jul', avg_uvi: 2.6 },
    { month: 8, label: 'Aug', avg_uvi: 3.6 },
    { month: 9, label: 'Sep', avg_uvi: 5.4 },
    { month: 10, label: 'Oct', avg_uvi: 7.5 },
    { month: 11, label: 'Nov', avg_uvi: 9.4 },
    { month: 12, label: 'Dec', avg_uvi: 10.6 },
  ],
  hobart: [
    { month: 1, label: 'Jan', avg_uvi: 7.0 },
    { month: 2, label: 'Feb', avg_uvi: 6.2 },
    { month: 3, label: 'Mar', avg_uvi: 4.6 },
    { month: 4, label: 'Apr', avg_uvi: 2.9 },
    { month: 5, label: 'May', avg_uvi: 1.7 },
    { month: 6, label: 'Jun', avg_uvi: 1.2 },
    { month: 7, label: 'Jul', avg_uvi: 1.4 },
    { month: 8, label: 'Aug', avg_uvi: 2.0 },
    { month: 9, label: 'Sep', avg_uvi: 3.3 },
    { month: 10, label: 'Oct', avg_uvi: 4.8 },
    { month: 11, label: 'Nov', avg_uvi: 6.2 },
    { month: 12, label: 'Dec', avg_uvi: 7.1 },
  ]
})

const currentCityMonthlyData = computed(() => {
  return capitalCitiesData.value[selectedCity.value] || capitalCitiesData.value.melbourne
})

const selectedCityLabel = computed(() => {
  return cityKeys.find(c => c.id === selectedCity.value)?.name || 'Melbourne'
})

function getUVBandLabel(val) {
  if (val <= 2) return 'Low'
  if (val <= 5) return 'Moderate'
  if (val <= 7) return 'High'
  if (val <= 10) return 'Very High'
  return 'Extreme'
}

function uviColor(uvi) {
  if (uvi <= 2)  return '#4caf50'
  if (uvi <= 5)  return '#f9c74f'
  if (uvi <= 7)  return '#f77f00'
  if (uvi <= 10) return '#e63946'
  return '#7b2d8b'
}

// ── Fitzpatrick Skin Types (US2.2) ────────────────────────────────
const fitzpatrickTypes = [
  {
    type: 'Type I',
    title: 'Very Fair',
    colorCode: '#fdebe2',
    accentColor: '#e63946',
    reaction: 'Always burns, never tans',
    description: 'Extremely pale, ivory skin with red/blonde hair and blue/green eyes. Freckles easily.',
    burnBaseMinutes: 67, // Burn Time = burnBaseMinutes / UV
    melaninExplanation: 'Lowest eumelanin content; high pheomelanin creates free radicals under UV rather than absorbing radiation.',
    recommendation: 'Extreme caution. Strict SPF 50+ broad-spectrum sunscreen every 90 minutes. Broad-brim hat, sunglasses, and UPF 50+ clothing mandatory.'
  },
  {
    type: 'Type II',
    title: 'Fair',
    colorCode: '#f8decb',
    accentColor: '#f77f00',
    reaction: 'Burns easily, tans minimally',
    description: 'Fair skin with blonde/brown hair and blue, hazel, or brown eyes.',
    burnBaseMinutes: 100,
    melaninExplanation: 'Limited photoprotective melanin. UV radiation quickly triggers erythema (sunburn) and DNA strand breaks.',
    recommendation: 'Daily SPF 50+ application. Seek shade between 10am–3pm. Reapply sunscreen frequently after physical activity.'
  },
  {
    type: 'Type III',
    title: 'Medium',
    colorCode: '#e8be9e',
    accentColor: '#b5830a',
    reaction: 'Burns moderately, tans gradually',
    description: 'Creamy white to light olive skin with brown hair and brown eyes.',
    burnBaseMinutes: 135,
    melaninExplanation: 'Moderate eumelanin synthesis. Can develop a tan, but tanning itself represents cellular damage.',
    recommendation: 'Apply SPF 30+ or SPF 50+ when UV is 3 or higher. Wear sunglasses and cover exposed skin when spending hours outdoors.'
  },
  {
    type: 'Type IV',
    title: 'Olive',
    colorCode: '#c89d7c',
    accentColor: '#52796f',
    reaction: 'Burns minimally, tans easily',
    description: 'Olive or light Mediterranean/Asian/Hispanic brown skin tone.',
    burnBaseMinutes: 180,
    melaninExplanation: 'Higher basal eumelanin provides natural SPF ~3–4, absorbing substantial UVB, but UVA still drives deep cellular aging.',
    recommendation: 'SPF 30+ recommended. Regular shade breaks during peak UV. High risk of hyperpigmentation and sunspots without sun protection.'
  },
  {
    type: 'Type V',
    title: 'Brown',
    colorCode: '#986b49',
    accentColor: '#3a5a40',
    reaction: 'Rarely burns, tans profusely',
    description: 'Middle Eastern, South Asian, or dark Hispanic skin tones.',
    burnBaseMinutes: 240,
    melaninExplanation: 'Rich in protective eumelanin, reducing sunburn likelihood, but cumulative UV damage still triggers melanoma.',
    recommendation: 'Wear sunscreen on face, hands, and neck. Sunglasses remain critical to prevent cataracts and ocular pterygiums.'
  },
  {
    type: 'Type VI',
    title: 'Deep Brown',
    colorCode: '#56382d',
    accentColor: '#1b4332',
    reaction: 'Never burns, deeply pigmented',
    description: 'Deeply pigmented African, Indigenous Australian, or Melanesian skin tone.',
    burnBaseMinutes: 320,
    melaninExplanation: 'Maximum eumelanin density filters up to 85% of UV radiation. Burns are exceptionally rare.',
    recommendation: 'Year-round sunglasses for eye health. Monitor palms, soles of feet, and nails for rare acral lentiginous melanoma lesions.'
  },
]

const selectedSkinType = ref(fitzpatrickTypes[0]) // default Type I
const testUV = ref(uvStore.uvIndex && uvStore.uvIndex > 0 ? uvStore.uvIndex : 8)

const calculatedBurnTime = computed(() => {
  if (!selectedSkinType.value) return 'Select Skin Type'
  const uv = Math.max(1, testUV.value)
  const minutes = Math.round(selectedSkinType.value.burnBaseMinutes / uv)
  if (minutes < 10) return '< 10 minutes'
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `~${minutes} minutes`
})

const calculatedBurnTimeColor = computed(() => {
  const uv = Math.max(1, testUV.value)
  const minutes = selectedSkinType.value ? Math.round(selectedSkinType.value.burnBaseMinutes / uv) : 60
  if (minutes <= 15) return '#e63946'
  if (minutes <= 30) return '#f77f00'
  if (minutes <= 60) return '#b5830a'
  return '#2d6a4f'
})

// Fetch live backend stats on mount
onMounted(async () => {
  try {
    const resCancer = await axios.get('/api/awareness/cancer-stats', { timeout: 3000 })
    if (resCancer.data?.available && resCancer.data.data?.length) {
      cancerData.value = resCancer.data.data
    }

    const resCities = await axios.get('/api/awareness/cities-uv', { timeout: 3000 })
    if (resCities.data?.available && resCities.data.cities) {
      capitalCitiesData.value = resCities.data.cities
    }
  } catch {
    // Graceful offline fallback already pre-populated
  }
})
</script>

<style scoped>
/* ── Chart Container ─────────────────────────────────────────────── */
.chart-wrapper {
  width: 100%;
  height: 280px;
  background: #fdfbf7;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 0.5rem;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-circle {
  cursor: pointer;
  transition: transform 0.2s, r 0.2s;
}

.chart-circle:hover {
  r: 7;
}

.chart-tooltip {
  position: absolute;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  pointer-events: none;
  font-size: 0.8rem;
  z-index: 10;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  transform: translateX(-50%);
}

/* ── City Comparison Chart ───────────────────────────────────────── */
.city-chart-container {
  height: 200px;
  background: #fdfbf7;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
}

.city-month-col {
  flex: 1;
  gap: 3px;
  cursor: pointer;
}

.city-val-tag {
  font-size: 0.65rem;
  font-weight: 800;
}

.city-bar-track {
  width: 100%;
  max-width: 24px;
  height: 130px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-end;
}

.city-bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.4s ease-out;
}

.city-month-name {
  font-size: 0.68rem;
  color: var(--text-secondary);
  margin-top: 4px;
  font-weight: 600;
}

.city-month-col:hover .city-bar-fill {
  filter: brightness(1.15);
}

.city-tooltip {
  position: absolute;
  top: 10px;
  right: 15px;
  background: rgba(26, 26, 46, 0.95);
  color: #fff;
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  pointer-events: none;
}

/* ── Skin Type Selector ─────────────────────────────────────────── */
.skin-type-btn {
  background: #fff;
  border: 2px solid var(--border) !important;
  transition: border-color var(--transition), transform var(--transition);
}

.skin-type-btn:hover {
  transform: translateY(-2px);
  border-color: #adb5bd !important;
}

.skin-type-btn.active {
  border-color: var(--color-high) !important;
  background: #fff8f2;
}

.skin-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 4px rgba(0,0,0,0.25);
  flex-shrink: 0;
}

.skin-swatch-lg {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 6px rgba(0,0,0,0.25);
  flex-shrink: 0;
}

.personalized-card {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 576px) {
  .chart-wrapper { height: 230px; }
  .city-val-tag { font-size: 0.55rem; }
  .city-month-name { font-size: 0.58rem; }
}
</style>
