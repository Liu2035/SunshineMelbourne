/**
 * Seed script — aggregates uv-melbourne-2024.csv to daily stats
 * and uploads to Supabase table `uv_melbourne_2024`.
 *
 * Run: npm run seed:supabase
 *
 * CSV format: Date-Time,Lat,Lon,UV_Index  (minute resolution, ~527k rows)
 * Output: one row per day — date, month, day, max_uvi, avg_uvi
 */

import { createReadStream } from 'fs'
import { createInterface }  from 'readline'
import { fileURLToPath }    from 'url'
import { dirname, join }    from 'path'
import { createClient }     from '@supabase/supabase-js'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH  = join(__dirname, '../../data/uv-melbourne-2024.csv')
const BATCH     = 50   // rows per Supabase insert

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// ── 1. Read CSV — keep only the first reading of each hour ───────
console.log('Reading CSV…')

// key: 'YYYY-MM-DD|HH'  value: uvi (first minute of that hour)
const byHour = {}

const rl = createInterface({
  input: createReadStream(CSV_PATH),
  crlfDelay: Infinity
})

let lineNo = 0
for await (const line of rl) {
  lineNo++
  if (lineNo === 1) continue   // header

  const cols = line.split(',')
  if (cols.length < 4) continue

  const dtRaw   = cols[0].trim()                // '2024-01-01 12:00:00'
  const dateStr = dtRaw.slice(0, 10)            // 'YYYY-MM-DD'
  const hour    = parseInt(dtRaw.slice(11, 13), 10)
  const minute  = parseInt(dtRaw.slice(14, 16), 10)
  const uvi     = parseFloat(cols[3])

  if (isNaN(uvi) || isNaN(hour)) continue
  if (minute !== 0) continue                    // only :00 readings

  const key = `${dateStr}|${hour}`
  if (byHour[key] === undefined) byHour[key] = uvi   // first (and only) per hour
}

console.log(`Parsed ${lineNo - 1} data rows → ${Object.keys(byHour).length} hourly readings kept`)

// ── 2. Build rows ────────────────────────────────────────────────
const rows = Object.entries(byHour)
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([key, uvi]) => {
    const [dateStr, hourStr] = key.split('|')
    const [, mm, dd] = dateStr.split('-')
    return {
      date:    dateStr,
      month:   parseInt(mm, 10),
      day:     parseInt(dd, 10),
      hour:    parseInt(hourStr, 10),
      avg_uvi: parseFloat(uvi.toFixed(2))
    }
  })

// ── 3. Upload to Supabase in batches ────────────────────────────
console.log(`Uploading ${rows.length} rows to Supabase…`)

let uploaded = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH)
  const { error } = await supabase
    .from('uv_melbourne_2024')
    .upsert(batch, { onConflict: 'date,hour' })

  if (error) {
    console.error(`Batch ${i}–${i + BATCH} failed:`, error.message)
  } else {
    uploaded += batch.length
    process.stdout.write(`\r  ${uploaded}/${rows.length} rows uploaded…`)
  }
}

console.log(`\n✓ Done. ${uploaded} rows in uv_melbourne_2024.`)
