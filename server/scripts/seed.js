/**
 * Seed script — populates the SQLite database with monthly average UV data.
 *
 * Default source: data/uv_monthly_avg.csv
 *   Format: city,month,avg_uvi  (pre-aggregated monthly averages)
 *   Source: Derived from ARPANSA / Data.gov.au UV datasets for 8 Australian capital cities
 *           https://data.gov.au/data/organization/australia
 *
 * To re-seed: npm run seed
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const csvPath   = join(__dirname, '../../data/uv_monthly_avg.csv')
const dbPath    = join(__dirname, '../../data/uv.db')

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS uv_monthly_avg (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    city    TEXT    NOT NULL COLLATE NOCASE,
    month   INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    avg_uvi REAL    NOT NULL,
    UNIQUE(city, month)
  )
`)

const insert = db.prepare(`
  INSERT INTO uv_monthly_avg (city, month, avg_uvi)
  VALUES (?, ?, ?)
  ON CONFLICT(city, month) DO UPDATE SET avg_uvi = excluded.avg_uvi
`)

const csv = readFileSync(csvPath, 'utf-8')
const lines = csv.trim().split('\n')
const header = lines[0].split(',').map(h => h.trim())

const cityIdx  = header.indexOf('city')
const monthIdx = header.indexOf('month')
const uviIdx   = header.indexOf('avg_uvi')

if (cityIdx === -1 || monthIdx === -1 || uviIdx === -1) {
  console.error('CSV must have columns: city, month, avg_uvi')
  process.exit(1)
}

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(row.city, row.month, row.avg_uvi)
  }
})

const rows = lines.slice(1)
  .filter(line => line.trim())
  .map(line => {
    const cols = line.split(',').map(c => c.trim())
    return {
      city:    cols[cityIdx].toLowerCase(),
      month:   parseInt(cols[monthIdx], 10),
      avg_uvi: parseFloat(cols[uviIdx])
    }
  })
  .filter(r => !isNaN(r.month) && !isNaN(r.avg_uvi))

insertMany(rows)

const count = db.prepare('SELECT COUNT(*) as n FROM uv_monthly_avg').get()
console.log(`✓ Seeded ${rows.length} rows. Total records in DB: ${count.n}`)
db.close()
