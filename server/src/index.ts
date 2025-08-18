// Load environment variables FIRST
import './config/env'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import { corsMiddleware, securityHeaders, requestLogger } from '@/middleware/authMiddleware'
import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/user'
import analyticsRoutes from '@/routes/analytics'
import recommendationsRoutes from '@/routes/recommendations'
import readmeRoutes from '@/routes/readme'
import exportRoutes from '@/routes/export'
import roadmapRoutes from '@/routes/roadmap'
import logger from '@/utils/logger'

import { createAnalyticsService } from '@/services/analyticsService'
import { createGitHubService } from '@/services/githubService'

// Environment variables are loaded in ./config/env

const app = express()
const PORT: number = Number(process.env.PORT) || 5000

// Security middleware
app.use(helmet())

// CORS configuration: allow production and development origins
const allowedOrigins = [
  process.env.CLIENT_URL || 'https://git-viz-lytics.vercel.app',
  'https://git-viz-lytics.vercel.app',
  'http://127.0.0.1:3000',
  'http://localhost:3000'
]
app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server or curl (no origin)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Cookie parser for reading cookies set during OAuth flow
app.use(cookieParser())
// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/recommendations', recommendationsRoutes)
app.use('/api/readme', readmeRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/roadmap', roadmapRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server (only in development, Vercel handles this in production)
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  app.listen(PORT, '127.0.0.1', () => {
    logger.info(`Server running on http://127.0.0.1:${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
  })
} else {
  logger.info(`Server configured for production deployment on ${process.env.CLIENT_URL || 'https://git-viz-lytics.vercel.app'}`)
}

// Auto-refresh analytics job using setInterval to avoid extra deps

const intervalMs = Number(process.env.ANALYTICS_UPDATE_INTERVAL || 3600000)
let lastRun = 0
setInterval(async () => {
  const now = Date.now()
  if (now - lastRun < intervalMs) return
  lastRun = now
  try {
    const demoUser = process.env.DEMO_LOGIN
    if (!demoUser) return
    const github = createGitHubService()
    const analytics = createAnalyticsService(github)
    await analytics.calculateProfileScore(demoUser)
    await analytics.analyzeRepositories(demoUser)
  } catch (e) {
    logger.error('Auto-refresh analytics job failed', e as any)
  }
}, 60 * 1000)

export default app
