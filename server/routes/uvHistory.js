import { Router } from 'express'
import db from '../db.js'

const router = Router()

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const KNOWN_CITIES = ['sydney', 'melbourne', 'brisbane', 'perth',
                      'adelaide', 'darwin', 'hobart', 'canberra']

/**
 * Match a freeform location string against the 8 cities in our dataset.
 * e.g. "Melbourne, Victoria" → "melbourne"
 */
function matchCity(raw) {
  if (!raw) return null
  const lower = raw.toLowerCase()
  return KNOWN_CITIES.find(c => lower.includes(c)) ?? null
}

/**
 * GET /api/uv-history?city=Melbourne
 *
 * Returns monthly average UV data for the matched city.
 * Response includes a comparison for the current month.
 */
router.get('/uv-history', (req, res) => {
  const city = matchCity(req.query.city)

  if (!city) {
    return res.json({
      available: false,
      message: 'No historical UV data for this location. Data covers 8 Australian capital cities only.'
    })
  }

  const rows = db
    .prepare(`
      SELECT month, avg_uvi
      FROM uv_monthly_avg
      WHERE city = ? COLLATE NOCASE
      ORDER BY month
    `)
    .all(city)

  if (!rows.length) {
    return res.json({
      available: false,
      city,
      message: 'Database not seeded yet. Run: npm run seed'
    })
  }

  const currentMonth = new Date().getMonth() + 1
  const history = rows.map(r => ({
    month:   r.month,
    label:   MONTH_LABELS[r.month - 1],
    avg_uvi: r.avg_uvi
  }))

  const thisMonthRecord = history.find(h => h.month === currentMonth)

  res.json({
    available:     true,
    city:          city.charAt(0).toUpperCase() + city.slice(1),
    currentMonth,
    thisMonthAvg:  thisMonthRecord?.avg_uvi ?? null,
    history
  })
})

export default router
