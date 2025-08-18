import { Response } from 'express'
import { AuthenticatedRequest } from '@/middleware/authMiddleware'
import { ExportService, ExportOptions } from '@/services/exportService'
import { rateLimitByUser } from '@/middleware/authMiddleware'
import { randomUUID } from 'crypto'
import QRCode from 'qrcode'
import logger from '@/utils/logger'

export const exportProfileData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const {
      format = 'json',
      includeRecommendations = true,
      includeAnalytics = true,
      includeRepositories = true,
      includeContributions = false,
      dateRange
    } = req.body

    // Validate format
    if (!['json', 'csv', 'pdf', 'xlsx', 'xml'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Supported formats: json, csv, pdf, xlsx, xml'
      })
    }

    const options: ExportOptions = {
      format,
      includeRecommendations,
      includeAnalytics,
      includeRepositories,
      includeContributions,
      dateRange
    }

    logger.info(`Exporting profile data for ${req.user.login}`, { format, options })

    const exportService = new ExportService(req.user.access_token)
    const exportBuffer = await exportService.export(req.user.login, options)

    // Set appropriate headers
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `github-profile-${req.user.login}-${timestamp}.${format}`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json')
        break
      case 'csv':
        res.setHeader('Content-Type', 'text/csv')
        break
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf')
        break
      case 'xlsx':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        break
      case 'xml':
        res.setHeader('Content-Type', 'application/xml')
        break
    }

    res.setHeader('Content-Length', exportBuffer.length)
    res.send(exportBuffer)

  } catch (error) {
    logger.error('Export error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export profile data'
    })
  }
}

export const getExportFormats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        formats: [
          {
            id: 'json',
            name: 'JSON',
            description: 'Raw data in JSON format',
            mime_type: 'application/json',
            file_extension: 'json'
          },
          {
            id: 'csv',
            name: 'CSV',
            description: 'Comma-separated values for spreadsheet applications',
            mime_type: 'text/csv',
            file_extension: 'csv'
          },
          {
            id: 'pdf',
            name: 'PDF Report',
            description: 'Formatted report in PDF format',
            mime_type: 'application/pdf',
            file_extension: 'pdf'
          },
          {
            id: 'xlsx',
            name: 'Excel Spreadsheet',
            description: 'Excel workbook with multiple sheets',
            mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            file_extension: 'xlsx'
          },
          {
            id: 'xml',
            name: 'XML Data',
            description: 'Structured XML format',
            mime_type: 'application/xml',
            file_extension: 'xml'
          }
        ],
        options: {
          includeRecommendations: {
            type: 'boolean',
            default: true,
            description: 'Include AI-generated recommendations'
          },
          includeAnalytics: {
            type: 'boolean',
            default: true,
            description: 'Include profile analytics and scores'
          },
          includeRepositories: {
            type: 'boolean',
            default: true,
            description: 'Include repository information'
          },
          includeContributions: {
            type: 'boolean',
            default: false,
            description: 'Include contribution history (requires additional API calls)'
          },
          dateRange: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' }
            },
            description: 'Date range for time-based data'
          }
        }
      }
    })
  } catch (error) {
    logger.error('Get export formats error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get export formats'
    })
  }
}

export const generateShareableLink = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const {
      includePrivateRepos = false,
      includeContributions = true,
      includeAnalytics = true,
      includeRecommendations = false,
      customMessage = '',
      expiresIn = '30d',
      allowComments = false,
      trackViews = true,
      requireAuth = false
    } = req.body

    // Generate a unique share token
    const shareToken = require('crypto').randomBytes(32).toString('hex')
    
    // Calculate expiration time
    const expirationMap: Record<string, number | null> = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'never': null
    }
    const expirationMs = expirationMap[expiresIn] || 30 * 24 * 60 * 60 * 1000

    // In a real application, you would store this in a database with expiration
    const shareData = {
      userId: req.user.id,
      username: req.user.login,
      includePrivateRepos,
      includeContributions,
      includeAnalytics,
      includeRecommendations,
      customMessage,
      allowComments,
      trackViews,
      requireAuth,
      expiresAt: expirationMs ? new Date(Date.now() + expirationMs) : null,
      createdAt: new Date(),
      views: 0,
      shares: 0
    }

    // Store in cache for now (in production, use a database)
    // await cacheService.set(`share:${shareToken}`, shareData, { ttl: 7 * 24 * 60 * 60 })

    const shareUrl = `${process.env.CLIENT_URL}/share/${shareToken}`

    res.json({
      success: true,
      data: {
        shareUrl: shareUrl,
        shareToken: shareToken,
        expiresAt: shareData.expiresAt,
        createdAt: shareData.createdAt,
        embedUrl: `${process.env.CLIENT_URL}/embed/${shareToken}`,
        qrCodeUrl: `${process.env.CLIENT_URL}/api/share/${shareToken}/qr`,
        views: shareData.views,
        shares: shareData.shares,
        settings: {
          includePrivateRepos,
          includeContributions,
          includeAnalytics,
          includeRecommendations,
          customMessage,
          allowComments,
          trackViews,
          requireAuth
        }
      }
    })

  } catch (error) {
    logger.error('Generate shareable link error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate shareable link'
    })
  }
}

export const getSharedProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shareToken } = req.params

    if (!shareToken) {
      return res.status(400).json({
        success: false,
        error: 'Share token is required'
      })
    }

    // In a real application, you would fetch this from a database
    // const shareData = await cacheService.get(`share:${shareToken}`)
    
    // For now, return a placeholder response
    res.json({
      success: false,
      error: 'Shared profiles feature is not fully implemented yet',
      message: 'This feature requires database integration for storing share tokens'
    })

  } catch (error) {
    logger.error('Get shared profile error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get shared profile'
    })
  }
}

export const getSocialShareData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const { platform = 'twitter' } = req.query

    // Generate social media share content
    const shareContent = {
      twitter: {
        text: `Check out my GitHub profile analytics! 🚀 #GitHubAnalytics #Developer`,
        url: `${process.env.CLIENT_URL}/profile/${req.user.login}`,
        hashtags: ['GitHubAnalytics', 'Developer', 'OpenSource'],
        via: 'GitHubAnalytics'
      },
      linkedin: {
        title: 'My GitHub Profile Analytics',
        summary: 'Discover insights about my development journey and contributions',
        url: `${process.env.CLIENT_URL}/profile/${req.user.login}`
      },
      facebook: {
        quote: 'Check out my GitHub profile analytics and development insights!',
        url: `${process.env.CLIENT_URL}/profile/${req.user.login}`
      }
    }

    const platformData = shareContent[platform as keyof typeof shareContent]

    if (!platformData) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported platform. Supported platforms: twitter, linkedin, facebook'
      })
    }

    res.json({
      success: true,
      data: {
        platform,
        content: platformData,
        share_urls: {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.twitter.text)}&url=${encodeURIComponent(shareContent.twitter.url)}&hashtags=${shareContent.twitter.hashtags.join(',')}`,
          linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareContent.linkedin.url)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareContent.facebook.url)}&quote=${encodeURIComponent(shareContent.facebook.quote)}`
        }
      }
    })

  } catch (error) {
    logger.error('Get social share data error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get social share data'
    })
  }
}

export const generateQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shareToken } = req.params

    if (!shareToken) {
      return res.status(400).json({
        success: false,
        error: 'Share token is required'
      })
    }

    // Generate the share URL
    const shareUrl = `${process.env.CLIENT_URL}/share/${shareToken}`

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(shareUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      }
    })

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Length', qrCodeBuffer.length)
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour

    // Send the QR code image
    res.send(qrCodeBuffer)
  } catch (error) {
    logger.error('Error generating QR code:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    })
  }
}

// Rate limiting middleware for exports (more restrictive)
export const exportRateLimit = rateLimitByUser(5, 60 * 60 * 1000) // 5 exports per hour
