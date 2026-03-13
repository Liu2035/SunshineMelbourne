import { Router }   from 'express'
import { supabase } from '../supabase.js'

const router = Router()

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * GET /api/uv-history
 *
 * Returns:
 *  - same hour on the same calendar day in 2024 (e.g. today 12:23 → 2024 same day 12:00)
 *  - monthly averages for the bar chart (avg of hourly readings per month)
 */
router.get('/uv-history', async (req, res) => {
  const now   = new Date()
  const month = now.getMonth() + 1
  const day   = now.getDate()
  const hour  = now.getHours()   // current hour, floor (12:23 → 12)

  // ── Same hour, same day in 2024 ──────────────────────────────
  const { data: hourRow, error: hourErr } = await supabase
    .from('uv_melbourne_2024')
    .select('date, hour, avg_uvi')
    .eq('month', month)
    .eq('day', day)
    .eq('hour', hour)
    .maybeSingle()

  if (hourErr) {
    return res.status(500).json({ available: false, message: hourErr.message })
  }

  // ── Monthly averages for bar chart ───────────────────────────
  const { data: allRows, error: allErr } = await supabase
    .from('uv_melbourne_2024')
    .select('month, avg_uvi')

  if (allErr) {
    return res.status(500).json({ available: false, message: allErr.message })
  }

  const monthMap = {}
  for (const row of allRows) {
    if (!monthMap[row.month]) monthMap[row.month] = { sum: 0, count: 0 }
    monthMap[row.month].sum   += row.avg_uvi
    monthMap[row.month].count += 1
  }

  const monthlyAvg = Object.entries(monthMap)
    .sort(([a], [b]) => a - b)
    .map(([m, v]) => ({
      month:   parseInt(m),
      label:   MONTH_LABELS[parseInt(m) - 1],
      avg_uvi: parseFloat((v.sum / v.count).toFixed(1))
    }))

  // Format hour as "12:00"
  const hourLabel = `${String(hour).padStart(2, '0')}:00`

  res.json({
    available:    true,
    city:         'Melbourne',
    today:        { month, day, hour, hourLabel },
    sameHour2024: hourRow
      ? { date: hourRow.date, hour: hourRow.hour, hourLabel, avg_uvi: hourRow.avg_uvi }
      : null,
    monthlyAvg,
    currentMonth: month
  })
})

export default router
