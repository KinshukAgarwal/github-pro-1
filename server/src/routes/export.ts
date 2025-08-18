import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { authenticateToken } from '@/middleware/authMiddleware'
import * as exportController from '@/controllers/exportController'

const router = Router()

// All export routes require authentication
router.use(authenticateToken)

// Export profile data
router.post('/profile', 
  exportController.exportRateLimit,
  asyncHandler(exportController.exportProfileData)
)

// Get available export formats and options
router.get('/formats', asyncHandler(exportController.getExportFormats))

// Generate shareable link
router.post('/share', asyncHandler(exportController.generateShareableLink))

// Get shared profile (public endpoint, but still needs validation)
router.get('/share/:shareToken', asyncHandler(exportController.getSharedProfile))

// Generate QR code for shared profile
router.get('/share/:shareToken/qr', asyncHandler(exportController.generateQRCode))

// Get social media share data
router.get('/social', asyncHandler(exportController.getSocialShareData))

export default router
