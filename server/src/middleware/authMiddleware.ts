import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { GitHubService } from '@/services/githubService'
import logger from '@/utils/logger'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    login: string
    name: string
    email: string
    avatar_url: string
    access_token: string
  }
}

export interface JWTPayload {
  userId: string
  login: string
  access_token: string
  iat?: number
  exp?: number
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured')
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    // Optionally validate GitHub access token (strict mode only)
    const strict = (process.env.STRICT_AUTH || '').toLowerCase() === 'true'
    if (strict) {
      try {
        const githubService = new GitHubService(decoded.access_token)
        const user = await githubService.getUser()
        if (!user || user.login !== decoded.login) {
          return res.status(401).json({ success: false, error: 'Invalid or expired token' })
        }
        // Attach user info from GitHub
        req.user = {
          id: user.id.toString(),
          login: user.login,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          access_token: decoded.access_token
        }
      } catch (e) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' })
      }
    } else {
      // Trust JWT payload in non-strict mode to avoid per-request GitHub calls
      req.user = {
        id: decoded.userId,
        login: decoded.login,
        name: '',
        email: '',
        avatar_url: '',
        access_token: decoded.access_token
      }
    }

    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next() // Continue without authentication
    }

    // Try to authenticate, but don't fail if it doesn't work
    await authenticateToken(req, res, next)
  } catch (error) {
    // Log the error but continue without authentication
    logger.warn('Optional authentication failed:', error)
    next()
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    // For now, we don't have roles in GitHub, but this is extensible
    // You could check for organization membership, repository ownership, etc.
    next()
  }
}

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>()

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = (req.user?.id || req.ip) as string
    const now = Date.now()

    const userLimit = userRequests.get(userId)

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize the limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      })
    }

    userLimit.count++
    next()
  }
}

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    })
  }

  // In a real application, you would validate this against a database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    })
  }

  next()
}

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://git-viz-lytics.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL
  ].filter(Boolean)

  const origin = req.headers.origin
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  next()
}

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com https://github.com",
    "frame-ancestors 'none'"
  ].join('; ')
  
  res.setHeader('Content-Security-Policy', csp)

  next()
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, url, ip } = req
    const { statusCode } = res
    
    logger.info(`${method} ${url} ${statusCode} ${duration}ms`, {
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent: req.headers['user-agent']
    })
  })

  next()
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error:', error)

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(isDevelopment && { details: error.message, stack: error.stack })
  })
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  })
}
