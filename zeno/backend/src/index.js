import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import passport from 'passport'
import connectDB from './utils/db.js'
import './config/passport.js'
import authRouter from './routes/auth.js'
import oauthRouter from './routes/oauth.js'
import adminRouter from './routes/admin.js'
import shopsRouter from './routes/shops.js'
import staffRouter from './routes/staff.js'
import meRouter from './routes/me.js'
import customersRouter from './routes/customers.js'
import productsRouter from './routes/products.js'
import salesRouter from './routes/sales.js'
import dashboardRouter from './routes/dashboard.js'
import reportsRouter from './routes/reports.js'
import feedbackRouter from './routes/feedback.js'
import errorHandler from './middleware/errorHandler.js'

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

const app = express()
const PORT = process.env.PORT || 4000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
    },
  })
)
app.use(passport.initialize())
app.use(passport.session())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/oauth', oauthRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/me', meRouter)
app.use('/api/v1/shops', shopsRouter)
app.use('/api/v1/staff', staffRouter)
app.use('/api/v1/customers', customersRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/sales', salesRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/reports', reportsRouter)
app.use('/api/v1/feedback', feedbackRouter)

app.get('/', (req, res) => {
  res.json({ message: 'ZENO API is running' })
})

app.use((req, res) => {
  res.status(404).json({ success: false, error: `${req.method} ${req.path} not found` })
})

app.use(errorHandler)


connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
})
