import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import uvHistoryRouter from './routes/uvHistory.js'
import awarenessRouter from './routes/awareness.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api', uvHistoryRouter)
app.use('/api', awarenessRouter)

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
