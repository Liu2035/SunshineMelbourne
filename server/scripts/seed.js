/**
 * Seed script — populates SQLite database with:
 *  1. uv_monthly_avg (ARPANSA 8 Australian capital cities monthly UV)
 *  2. uv_melbourne_2024 (ARPANSA 2024 Melbourne hourly UV dataset)
 *  3. cancer_stats (AIHW Australian Melanoma incidence & mortality 1982–2020)
 *
 * To run manually: npm run seed
 */

import { readFileSync, existsSync, createReadStream } from 'fs'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir   = join(__dirname, '../../data')
const csvMonth  = join(dataDir, 'uv_monthly_avg.csv')
const csv2024   = join(dataDir, 'uv-melbourne-2024.csv')
const dbPath    = join(dataDir, 'uv.db')

export const CANCER_STATS = [
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
]

export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS uv_monthly_avg (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      city    TEXT    NOT NULL COLLATE NOCASE,
      month   INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
      avg_uvi REAL    NOT NULL,
      UNIQUE(city, month)
    );

    CREATE TABLE IF NOT EXISTS uv_melbourne_2024 (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      date    TEXT    NOT NULL,
      month   INTEGER NOT NULL,
      day     INTEGER NOT NULL,
      hour    INTEGER NOT NULL,
      avg_uvi REAL    NOT NULL,
      UNIQUE(date, hour)
    );

    CREATE TABLE IF NOT EXISTS cancer_stats (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      year            INTEGER NOT NULL UNIQUE,
      incidence_rate  REAL    NOT NULL,
      mortality_rate  REAL    NOT NULL,
      new_cases       INTEGER NOT NULL,
      deaths          INTEGER NOT NULL
    );
  `)
}

export async function seedMonthlyAvg(db) {
  if (!existsSync(csvMonth)) return
  const csv = readFileSync(csvMonth, 'utf-8')
  const lines = csv.trim().split('\n')
  const header = lines[0].split(',').map(h => h.trim())
  const cityIdx = header.indexOf('city')
  const monthIdx = header.indexOf('month')
  const uviIdx = header.indexOf('avg_uvi')

  if (cityIdx === -1 || monthIdx === -1 || uviIdx === -1) return

  const insert = db.prepare(`
    INSERT INTO uv_monthly_avg (city, month, avg_uvi)
    VALUES (?, ?, ?)
    ON CONFLICT(city, month) DO UPDATE SET avg_uvi = excluded.avg_uvi
  `)

  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const c = line.split(',').map(s => s.trim())
    return {
      city: c[cityIdx].toLowerCase(),
      month: parseInt(c[monthIdx], 10),
      avg_uvi: parseFloat(c[uviIdx])
    }
  }).filter(r => !isNaN(r.month) && !isNaN(r.avg_uvi))

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item.city, item.month, item.avg_uvi)
  })
  insertMany(rows)
  console.log(`✓ Seeded ${rows.length} rows into uv_monthly_avg`)
}

export async function seedMelbourne2024(db) {
  if (!existsSync(csv2024)) return

  const insert = db.prepare(`
    INSERT INTO uv_melbourne_2024 (date, month, day, hour, avg_uvi)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date, hour) DO UPDATE SET avg_uvi = excluded.avg_uvi
  `)

  const rl = createInterface({
    input: createReadStream(csv2024),
    crlfDelay: Infinity
  })

  const rows = []
  let lineNo = 0

  for await (const line of rl) {
    lineNo++
    if (lineNo === 1) continue
    if (!line.includes(':00:00,')) continue

    const cols = line.split(',')
    if (cols.length < 4) continue

    const dtRaw = cols[0].trim()
    const dateStr = dtRaw.slice(0, 10)
    const hour = parseInt(dtRaw.slice(11, 13), 10)
    const uvi = parseFloat(cols[3])

    if (isNaN(uvi) || isNaN(hour)) continue
    const [, mm, dd] = dateStr.split('-')

    rows.push({
      date: dateStr,
      month: parseInt(mm, 10),
      day: parseInt(dd, 10),
      hour,
      avg_uvi: parseFloat(uvi.toFixed(2))
    })
  }

  const insertMany = db.transaction((items) => {
    for (const r of items) {
      insert.run(r.date, r.month, r.day, r.hour, r.avg_uvi)
    }
  })
  insertMany(rows)
  console.log(`✓ Seeded ${rows.length} hourly readings into uv_melbourne_2024`)
}

export function seedCancerStats(db) {
  const insert = db.prepare(`
    INSERT INTO cancer_stats (year, incidence_rate, mortality_rate, new_cases, deaths)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(year) DO UPDATE SET
      incidence_rate = excluded.incidence_rate,
      mortality_rate = excluded.mortality_rate,
      new_cases = excluded.new_cases,
      deaths = excluded.deaths
  `)

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.year, item.incidence_rate, item.mortality_rate, item.new_cases, item.deaths)
    }
  })
  insertMany(CANCER_STATS)
  console.log(`✓ Seeded ${CANCER_STATS.length} records into cancer_stats`)
}

export async function seedAll(db) {
  initSchema(db)
  await seedMonthlyAvg(db)
  await seedMelbourne2024(db)
  seedCancerStats(db)
}

// Standalone execution: node server/scripts/seed.js
const isMain = process.argv[1] && (
  process.argv[1].endsWith('seed.js') ||
  fileURLToPath(import.meta.url) === process.argv[1]
)
if (isMain) {
  const db = new Database(dbPath)
  console.log('Seeding SQLite database...')
  await seedAll(db)
  db.close()
  console.log('Done.')
}
