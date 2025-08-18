import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    login: string
    email: string
  }
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: AppError = new Error('Access token required')
      error.statusCode = 401
      throw error
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      const error: AppError = new Error('JWT secret not configured')
      error.statusCode = 500
      throw error
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    
    req.user = {
      id: decoded.id,
      login: decoded.login,
      email: decoded.email
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      const authError: AppError = new Error('Invalid token')
      authError.statusCode = 401
      next(authError)
    } else if (error instanceof jwt.TokenExpiredError) {
      const authError: AppError = new Error('Token expired')
      authError.statusCode = 401
      next(authError)
    } else {
      next(error)
    }
  }
}
