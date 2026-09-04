# Healthy Sunshine Melbourne ☀️

> **Project:** The Generational Shift in Sun-Safety Attitudes  
> **Target Audience:** Young Australians (Gen Z & Alpha) in Victoria, Australia  
> **Tech Stack:** Vue 3, Vite, Express, SQLite (better-sqlite3), Bootstrap 5

A 3-page modern web application designed to counter dangerous social media tanning trends, raise awareness about Australia's extreme solar UV radiation, and instill lifelong sun-protection habits.

---

## 🌟 Application Features (3-Page Scope)

### 1. Page 1 — UV Today (`/`)
- **Real-Time Localised UV Alerts (US1.1):** Live UV index and ambient temperature via geolocation or Australian city/suburb search.
- **Human Language Alert (US1.1):** Relatable, actionable alert translating abstract UV numbers into concrete time-to-burn metrics (e.g. *"Unprotected skin will begin damaging in ~15 minutes — find shade now"*).
- **Sun-Smart Clothing Recommendations (US3.3):** Dynamic clothing guide (wide-brim hats, UPF 50+ long sleeves, UV400 sunglasses, pants, shade guidance) tailored to the exact UV risk band.
- **2024 Melbourne Historical Comparison:** Queries official ARPANSA hourly radiation records for the same calendar date and hour in 2024, complete with comparison badges and a 12-month average bar chart.

### 2. Page 2 — Awareness (`/awareness`)
- **Melanoma Incidence & Mortality Trends 1982–2020 (US2.1):** Interactive dual-line chart visualizing 40 years of Australian Institute of Health and Welfare (AIHW) open cancer statistics with hover crosshairs and tooltips.
- **Australian Capital Cities UV Comparison (US2.1):** Interactive monthly UV comparison across Melbourne, Sydney, Brisbane, Darwin, Perth, and Hobart illustrating Melbourne's seasonal swing.
- **Skin Colour & UV Absorption Guide (US2.2):** Interactive Fitzpatrick Skin Types (Types I to VI) guide featuring real-time time-to-burn calculations, melanin mechanics, tailored advice, and myth-busting cards.

### 3. Page 3 — Protection (`/protection`)
- **Sunscreen Dosage Calculator (US3.1):** Interactive calculator implementing Cancer Council Australia's teaspoon rule (~5ml / 1 tsp per limb/torso/face) with teaspoon and bottle pump equivalents.
- **Sunscreen Reapplication Reminder (US3.2):** Circular animated countdown timer (90 min, 2 hr, and 10s demo presets) with progress ring, pause/reset controls, audio chime, and on-screen reapplication alerts.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Database Seeding
The project uses a zero-config local SQLite database (`data/uv.db`). It automatically initializes and seeds on first server launch, or can be seeded manually:
```bash
npm run seed
```

### Run Locally
To run both the Vite frontend (`http://localhost:5173`) and Express backend (`http://localhost:3001`):
```bash
npm run dev:all
```

Or run them individually in separate terminals:
```bash
# Terminal 1: Backend API
npm run server

# Terminal 2: Frontend
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 📂 Architecture & Data Sources

| Dataset | Source | Purpose |
|---------|--------|---------|
| **Melbourne UV 2024** | ARPANSA / Data.gov.au | Minute-by-minute solar UV readings aggregated to hourly benchmarks |
| **Capital Cities UV** | ARPANSA / Data.gov.au | Monthly average UV levels for Australian capitals |
| **Melanoma Statistics** | AIHW Australian Cancer Database (ACD) | National incidence and mortality rates (1982–2020) |
| **Live UV & Weather** | Open-Meteo & OpenWeatherMap | Real-time weather and solar radiation |

---

## ⚙️ Environment Variables (Optional)
The application works 100% out-of-the-box with built-in zero-config fallbacks. You can optionally configure `.env` for cloud integrations:
```env
# Optional: OpenWeatherMap OneCall 3.0 API Key (if omitted, free Open-Meteo BOM data is used)
VITE_OWM_API_KEY=your_key_here

# Optional: Supabase cloud database (if omitted, local SQLite data/uv.db is used)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
