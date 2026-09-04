import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'
import { initSchema, seedAll } from './scripts/seed.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../data')

mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'uv.db'))

// Initialize tables
initSchema(db)

// Auto-seed if database is empty
const monthlyCount = db.prepare('SELECT COUNT(*) as n FROM uv_monthly_avg').get().n
const cancerCount  = db.prepare('SELECT COUNT(*) as n FROM cancer_stats').get().n

if (monthlyCount === 0 || cancerCount === 0) {
  console.log('Database empty or incomplete, auto-seeding...')
  seedAll(db).catch(err => console.error('Auto-seed failed:', err))
}

export default db
