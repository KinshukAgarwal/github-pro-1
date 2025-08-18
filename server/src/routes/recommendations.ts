import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { authenticateToken } from '@/middleware/authMiddleware'
import * as recommendationsController from '@/controllers/recommendationsController'

const router = Router()

// All recommendation routes require authentication
router.use(authenticateToken)

// Get recommendations
router.get('/projects', asyncHandler(recommendationsController.getProjectRecommendations))
router.get('/technologies', asyncHandler(recommendationsController.getTechnologyRecommendations))
router.get('/career', asyncHandler(recommendationsController.getCareerInsights))

// Generate new recommendations
router.post('/generate', asyncHandler(recommendationsController.generateRecommendations))


// Roadmap routes
router.get('/roadmap', asyncHandler(recommendationsController.getRoadmap))
router.post('/roadmap', asyncHandler(recommendationsController.addRoadmapItem))
router.put('/roadmap/:id', asyncHandler(recommendationsController.updateRoadmapItem))
router.delete('/roadmap/:id', asyncHandler(recommendationsController.removeRoadmapItem))

// Feedback on recommendations
router.post('/:id/feedback', asyncHandler(recommendationsController.submitFeedback))

export default router
