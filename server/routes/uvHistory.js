import { Router } from 'express'
import db from '../db.js'

const router = Router()

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * GET /api/uv-history
 * Query params (optional):
 *  - city: string (default: 'melbourne')
 *  - month: number (1-12)
 *  - day: number (1-31)
 *  - hour: number (0-23)
 *
 * Returns:
 *  - available: boolean
 *  - city: string
 *  - today: { month, day, hour, hourLabel }
 *  - sameHour2024: { date, hour, hourLabel, avg_uvi }
 *  - monthlyAvg: array of { month, label, avg_uvi }
 *  - currentMonth: number
 */
router.get('/uv-history', (req, res) => {
  try {
    const now = new Date()
    const month = req.query.month ? parseInt(req.query.month, 10) : (now.getMonth() + 1)
    const day   = req.query.day   ? parseInt(req.query.day, 10)   : now.getDate()
    const hour  = req.query.hour  ? parseInt(req.query.hour, 10)  : now.getHours()
    const city  = (req.query.city || 'melbourne').toLowerCase().trim()

    // 1. Same hour, same day in 2024 for Melbourne
    let hourRow = db
      .prepare('SELECT date, hour, avg_uvi FROM uv_melbourne_2024 WHERE month = ? AND day = ? AND hour = ? LIMIT 1')
      .get(month, day, hour)

    // Fallback to closest hour on that day if top-of-hour reading wasn't recorded
    if (!hourRow) {
      hourRow = db
        .prepare('SELECT date, hour, avg_uvi FROM uv_melbourne_2024 WHERE month = ? AND day = ? ORDER BY ABS(hour - ?) LIMIT 1')
        .get(month, day, hour)
    }

    // 2. Monthly averages for the city
    let monthlyRows = db
      .prepare('SELECT month, avg_uvi FROM uv_monthly_avg WHERE city = ? COLLATE NOCASE ORDER BY month')
      .all(city)

    // If city not found, fallback to melbourne
    if (!monthlyRows || monthlyRows.length === 0) {
      monthlyRows = db
        .prepare('SELECT month, avg_uvi FROM uv_monthly_avg WHERE city = "melbourne" ORDER BY month')
        .all()
    }

    const monthlyAvg = monthlyRows.map(r => ({
      month: r.month,
      label: MONTH_LABELS[r.month - 1],
      avg_uvi: parseFloat(r.avg_uvi.toFixed(1))
    }))

    const hourLabel = `${String(hour).padStart(2, '0')}:00`

    res.json({
      available: true,
      city: city.charAt(0).toUpperCase() + city.slice(1),
      today: { month, day, hour, hourLabel },
      sameHour2024: hourRow ? {
        date: hourRow.date,
        hour: hourRow.hour,
        hourLabel: `${String(hourRow.hour).padStart(2, '0')}:00`,
        avg_uvi: hourRow.avg_uvi
      } : null,
      monthlyAvg,
      currentMonth: month
    })
  } catch (err) {
    console.error('Error in /api/uv-history:', err)
    res.status(500).json({ available: false, message: err.message })
  }
})

export default router
