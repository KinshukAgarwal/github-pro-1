import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { authenticateToken } from '@/middleware/authMiddleware'
import * as analyticsController from '@/controllers/analyticsController'

const router = Router()

// All analytics routes require authentication
router.use(authenticateToken)

// Profile analytics
router.get('/profile-score', asyncHandler(analyticsController.getProfileScore))
router.get('/repository-analysis', asyncHandler(analyticsController.getRepositoryAnalysis))
router.get('/contribution-patterns', asyncHandler(analyticsController.getContributionPatterns))
router.get('/language-distribution', asyncHandler(analyticsController.getLanguageDistribution))
router.get('/technology-trends', asyncHandler(analyticsController.getTechnologyTrends))

// Searchable market trends for any language/tech
router.get('/market-trends', asyncHandler(analyticsController.getMarketTrends))

// Refresh analytics data
router.post('/refresh', asyncHandler(analyticsController.refreshAnalytics))

// Export analytics
router.get('/export', asyncHandler(analyticsController.exportAnalytics))

export default router
