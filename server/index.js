import express from 'express'
import cors from 'cors'
import uvHistoryRouter from './routes/uvHistory.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use('/api', uvHistoryRouter)

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
