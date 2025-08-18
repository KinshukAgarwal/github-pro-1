import { Router } from 'express'
import { authenticateToken } from '@/middleware/authMiddleware'
import { asyncHandler } from '@/middleware/errorHandler'
import {
  getRoadmap,
  addRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  getRoadmapItem,
  updateProgress,
  getProgressStats
} from '@/controllers/roadmapController'

const router = Router()

// All roadmap routes require authentication
router.use(authenticateToken)

// Get user's roadmap
router.get('/', asyncHandler(getRoadmap))

// Get roadmap statistics
router.get('/stats', asyncHandler(getProgressStats))

// Get specific roadmap item
router.get('/:itemId', asyncHandler(getRoadmapItem))

// Add new roadmap item
router.post('/', asyncHandler(addRoadmapItem))

// Update roadmap item
router.put('/:itemId', asyncHandler(updateRoadmapItem))

// Update progress for roadmap item
router.patch('/:itemId/progress', asyncHandler(updateProgress))

// Delete roadmap item
router.delete('/:itemId', asyncHandler(deleteRoadmapItem))

export default router
