import { Router } from 'express'
import db from '../db.js'

const router = Router()

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * GET /api/awareness/cancer-stats
 * Returns AIHW historical melanoma statistics in Australia (1982–2020)
 */
router.get('/awareness/cancer-stats', (req, res) => {
  try {
    const rows = db.prepare('SELECT year, incidence_rate, mortality_rate, new_cases, deaths FROM cancer_stats ORDER BY year ASC').all()
    res.json({
      available: true,
      source: 'Australian Institute of Health and Welfare (AIHW) 2023, Australian Cancer Database (ACD), CC BY 3.0 AU',
      data: rows,
      youthInsights: {
        headline: 'Melanoma is the most common cancer in Australians aged 15–29',
        percentage: '15.4% of all adolescent & young adult cancers',
        tanningTrendRisk: 'A single severe blistering sunburn in youth increases lifetime melanoma risk by 80%.'
      }
    })
  } catch (err) {
    console.error('Error in /api/awareness/cancer-stats:', err)
    res.status(500).json({ available: false, message: err.message })
  }
})

/**
 * GET /api/awareness/cities-uv
 * Returns monthly average UV comparison across Australian capital cities from ARPANSA
 */
router.get('/awareness/cities-uv', (req, res) => {
  try {
    const rows = db.prepare('SELECT city, month, avg_uvi FROM uv_monthly_avg ORDER BY city, month').all()

    const cities = {}
    for (const r of rows) {
      const c = r.city.toLowerCase()
      if (!cities[c]) cities[c] = []
      cities[c].push({
        month: r.month,
        label: MONTH_LABELS[r.month - 1],
        avg_uvi: r.avg_uvi
      })
    }

    res.json({
      available: true,
      source: 'ARPANSA / Data.gov.au — Australian Capital Cities UV Radiation Monitoring Network, CC BY 2.5 AU',
      months: MONTH_LABELS,
      cities
    })
  } catch (err) {
    console.error('Error in /api/awareness/cities-uv:', err)
    res.status(500).json({ available: false, message: err.message })
  }
})

export default router
