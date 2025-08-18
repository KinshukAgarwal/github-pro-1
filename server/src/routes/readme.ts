import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { authenticateToken } from '@/middleware/authMiddleware'
import * as readmeController from '@/controllers/readmeController'

const router = Router()

// All README routes require authentication
router.use(authenticateToken)

// Analyze repositories for README quality
router.get('/analyze', asyncHandler(readmeController.analyzeRepositories))
router.get('/analyze/:repoId', asyncHandler(readmeController.analyzeRepository))

// Generate README
router.post('/generate', asyncHandler(readmeController.generateReadme))
router.get('/templates', asyncHandler(readmeController.getTemplates))
router.get('/templates/:id', asyncHandler(readmeController.getTemplate))

// Publish README to repository
router.post('/publish', asyncHandler(readmeController.publishReadme))

// Validate repository access
router.get('/validate/:repository_name', asyncHandler(readmeController.validateRepositoryAccess))

export default router
