import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../data')

mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'uv.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS uv_monthly_avg (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    city    TEXT    NOT NULL COLLATE NOCASE,
    month   INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    avg_uvi REAL    NOT NULL,
    UNIQUE(city, month)
  )
`)

export default db
