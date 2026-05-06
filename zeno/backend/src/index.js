import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import customersRouter from './routes/customers.js'
import productsRouter from './routes/products.js'
import salesRouter from './routes/sales.js'
import dashboardRouter from './routes/dashboard.js'
import reportsRouter from './routes/reports.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 4000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
)

app.use(express.json())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/customers', customersRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/sales', salesRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/reports', reportsRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
