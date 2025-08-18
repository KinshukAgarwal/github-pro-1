import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { authenticateToken, rateLimitByUser } from '@/middleware/authMiddleware'
import * as authController from '@/controllers/authController'

const router = Router()

// GitHub OAuth routes
router.get('/github', asyncHandler(authController.initiateGitHubAuth))
router.get('/github/callback', asyncHandler(authController.handleGitHubCallback))

// Session exchange endpoint to bootstrap client login from httpOnly cookies
router.get('/session', asyncHandler(authController.getSession))

// Debug route (remove in production)
router.get('/debug', asyncHandler(authController.debugOAuth))

// Protected routes
router.get('/me', authenticateToken, asyncHandler(authController.getCurrentUser))
router.post('/refresh', rateLimitByUser(10, 60 * 1000), asyncHandler(authController.refreshToken))
router.post('/logout', authenticateToken, asyncHandler(authController.logout))

export default router
