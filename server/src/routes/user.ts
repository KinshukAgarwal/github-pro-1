import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { authenticateToken } from '@/middleware/authMiddleware'
import * as userController from '@/controllers/userController'

const router = Router()

// All user routes require authentication
router.use(authenticateToken)

// User profile routes
router.get('/profile', asyncHandler(userController.getUserProfile))
router.put('/profile', asyncHandler(userController.updateUserProfile))

// User settings routes
router.get('/settings', asyncHandler(userController.getUserSettings))
router.put('/settings', asyncHandler(userController.updateUserSettings))

// User repositories
router.get('/repositories', asyncHandler(userController.getUserRepositories))
router.get('/repositories/:id', asyncHandler(userController.getRepository))

// User statistics
router.get('/stats', asyncHandler(userController.getUserStats))
router.get('/contributions', asyncHandler(userController.getContributions))

export default router
