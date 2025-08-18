import { ExportService } from '@/services/exportService'
import { GitHubService } from '@/services/githubService'
import { AnalyticsService } from '@/services/analyticsService'
import { AIService } from '@/services/aiService'
import { createMockGitHubUser, createMockRepository, createMockAnalytics, testUtils } from '../setup'

// Mock dependencies
jest.mock('@/services/githubService')
jest.mock('@/services/analyticsService')
jest.mock('@/services/aiService')
jest.mock('pdfkit')
jest.mock('csv-writer')

describe('ExportService', () => {
  let exportService: ExportService
  let mockGitHubService: jest.Mocked<GitHubService>
  let mockAnalyticsService: jest.Mocked<AnalyticsService>
  let mockAIService: jest.Mocked<AIService>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockGitHubService = new GitHubService('mock-token') as jest.Mocked<GitHubService>
    mockAnalyticsService = new AnalyticsService() as jest.Mocked<AnalyticsService>
    mockAIService = new AIService() as jest.Mocked<AIService>
    
    // Mock service constructors
    ;(GitHubService as jest.MockedClass<typeof GitHubService>).mockImplementation(() => mockGitHubService)
    ;(AnalyticsService as jest.MockedClass<typeof AnalyticsService>).mockImplementation(() => mockAnalyticsService)
    ;(AIService as jest.MockedClass<typeof AIService>).mockImplementation(() => mockAIService)
    
    exportService = new ExportService('mock-access-token')
  })

  describe('generateExportData', () => {
    it('should generate complete export data with all options', async () => {
      const mockUser = createMockGitHubUser()
      const mockRepositories = [createMockRepository()]
      const mockAnalytics = createMockAnalytics()
      const mockRecommendations = {
        projects: [{ title: 'Test Project', difficulty: 'intermediate' }],
        technologies: [{ name: 'TypeScript', demand_score: 95 }]
      }

      mockGitHubService.getUser.mockResolvedValue(mockUser)
      mockGitHubService.getUserRepositories.mockResolvedValue(mockRepositories)
      mockAnalyticsService.getProfileScore.mockResolvedValue(mockAnalytics)
      mockAIService.generateProjectRecommendations.mockResolvedValue(mockRecommendations.projects)
      mockAIService.generateTechnologyRecommendations.mockResolvedValue(mockRecommendations.technologies)

      const options = {
        format: 'json' as const,
        includeAnalytics: true,
        includeRepositories: true,
        includeRecommendations: true,
        includeContributions: true
      }

      const result = await exportService.generateExportData('testuser', options)

      expect(result).toMatchObject({
        user: expect.objectContaining({
          login: mockUser.login,
          name: mockUser.name,
          email: mockUser.email
        }),
        analytics: mockAnalytics,
        repositories: expect.arrayContaining([
          expect.objectContaining({
            name: mockRepositories[0].name,
            language: mockRepositories[0].language
          })
        ]),
        recommendations: expect.objectContaining({
          projects: mockRecommendations.projects,
          technologies: mockRecommendations.technologies
        }),
        contributions: expect.any(Array),
        exportedAt: expect.any(String),
        metadata: expect.objectContaining({
          version: '1.0.0',
          format: 'json',
          options
        })
      })

      expect(mockGitHubService.getUser).toHaveBeenCalled()
      expect(mockGitHubService.getUserRepositories).toHaveBeenCalledWith('testuser')
      expect(mockAnalyticsService.getProfileScore).toHaveBeenCalledWith('testuser')
      expect(mockAIService.generateProjectRecommendations).toHaveBeenCalled()
      expect(mockAIService.generateTechnologyRecommendations).toHaveBeenCalled()
    })

    it('should generate minimal export data with no optional features', async () => {
      const mockUser = createMockGitHubUser()
      mockGitHubService.getUser.mockResolvedValue(mockUser)

      const options = {
        format: 'json' as const,
        includeAnalytics: false,
        includeRepositories: false,
        includeRecommendations: false,
        includeContributions: false
      }

      const result = await exportService.generateExportData('testuser', options)

      expect(result).toMatchObject({
        user: expect.objectContaining({
          login: mockUser.login
        }),
        exportedAt: expect.any(String),
        metadata: expect.objectContaining({
          format: 'json',
          options
        })
      })

      expect(result.analytics).toBeUndefined()
      expect(result.repositories).toBeUndefined()
      expect(result.recommendations).toBeUndefined()
      expect(result.contributions).toBeUndefined()

      expect(mockAnalyticsService.getProfileScore).not.toHaveBeenCalled()
      expect(mockGitHubService.getUserRepositories).not.toHaveBeenCalled()
      expect(mockAIService.generateProjectRecommendations).not.toHaveBeenCalled()
    })

    it('should handle AI service errors gracefully', async () => {
      const mockUser = createMockGitHubUser()
      const mockRepositories = [createMockRepository()]

      mockGitHubService.getUser.mockResolvedValue(mockUser)
      mockGitHubService.getUserRepositories.mockResolvedValue(mockRepositories)
      mockAIService.generateProjectRecommendations.mockRejectedValue(new Error('AI service unavailable'))
      mockAIService.generateTechnologyRecommendations.mockRejectedValue(new Error('AI service unavailable'))

      const options = {
        format: 'json' as const,
        includeRecommendations: true
      }

      const result = await exportService.generateExportData('testuser', options)

      expect(result.recommendations).toMatchObject({
        error: 'Failed to generate recommendations',
        generated_at: expect.any(String)
      })
    })
  })

  describe('exportAsJSON', () => {
    it('should export data as JSON buffer', async () => {
      const mockUser = createMockGitHubUser()
      mockGitHubService.getUser.mockResolvedValue(mockUser)

      const options = {
        format: 'json' as const,
        includeAnalytics: false,
        includeRepositories: false,
        includeRecommendations: false,
        includeContributions: false
      }

      const result = await exportService.exportAsJSON('testuser', options)

      expect(result).toBeInstanceOf(Buffer)
      
      const jsonData = JSON.parse(result.toString('utf-8'))
      expect(jsonData).toMatchObject({
        user: expect.objectContaining({
          login: 'testuser'
        }),
        metadata: expect.objectContaining({
          format: 'json'
        })
      })
    })
  })

  describe('exportAsCSV', () => {
    it('should export data as CSV buffer', async () => {
      const mockUser = createMockGitHubUser()
      const mockRepositories = [createMockRepository()]
      const mockAnalytics = createMockAnalytics()

      mockGitHubService.getUser.mockResolvedValue(mockUser)
      mockGitHubService.getUserRepositories.mockResolvedValue(mockRepositories)
      mockAnalyticsService.getProfileScore.mockResolvedValue(mockAnalytics)

      // Mock fs operations
      const fs = require('fs/promises')
      fs.mkdir = jest.fn().mockResolvedValue(undefined)
      fs.readFile = jest.fn().mockResolvedValue(Buffer.from('test,csv,data\n1,2,3'))
      fs.unlink = jest.fn().mockResolvedValue(undefined)

      // Mock CSV writer
      const csvWriter = require('csv-writer')
      const mockCsvWriter = {
        writeRecords: jest.fn().mockResolvedValue(undefined)
      }
      csvWriter.createObjectCsvWriter = jest.fn().mockReturnValue(mockCsvWriter)

      const options = {
        format: 'csv' as const,
        includeAnalytics: true,
        includeRepositories: true
      }

      const result = await exportService.exportAsCSV('testuser', options)

      expect(result).toBeInstanceOf(Buffer)
      expect(csvWriter.createObjectCsvWriter).toHaveBeenCalled()
      expect(mockCsvWriter.writeRecords).toHaveBeenCalled()
      expect(fs.readFile).toHaveBeenCalled()
      expect(fs.unlink).toHaveBeenCalled()
    })
  })

  describe('exportAsPDF', () => {
    it('should export data as PDF buffer', async () => {
      const mockUser = createMockGitHubUser()
      const mockAnalytics = createMockAnalytics()

      mockGitHubService.getUser.mockResolvedValue(mockUser)
      mockAnalyticsService.getProfileScore.mockResolvedValue(mockAnalytics)

      // Mock PDFDocument
      const PDFDocument = require('pdfkit')
      const mockDoc = {
        fontSize: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        on: jest.fn(),
        end: jest.fn()
      }
      PDFDocument.mockImplementation(() => mockDoc)

      // Simulate PDF generation completion
      mockDoc.on.mockImplementation((event, callback) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0)
        }
        return mockDoc
      })

      const options = {
        format: 'pdf' as const,
        includeAnalytics: true
      }

      const resultPromise = exportService.exportAsPDF('testuser', options)

      // Simulate data chunks
      const dataCallback = mockDoc.on.mock.calls.find(call => call[0] === 'data')[1]
      dataCallback(Buffer.from('pdf-chunk-1'))
      dataCallback(Buffer.from('pdf-chunk-2'))

      // Simulate end event
      const endCallback = mockDoc.on.mock.calls.find(call => call[0] === 'end')[1]
      endCallback()

      const result = await resultPromise

      expect(result).toBeInstanceOf(Buffer)
      expect(PDFDocument).toHaveBeenCalled()
      expect(mockDoc.text).toHaveBeenCalledWith(
        'GitHub Profile Analytics Report',
        expect.objectContaining({ align: 'center' })
      )
    })

    it('should handle PDF generation errors', async () => {
      const mockUser = createMockGitHubUser()
      mockGitHubService.getUser.mockResolvedValue(mockUser)

      const PDFDocument = require('pdfkit')
      const mockDoc = {
        fontSize: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        on: jest.fn(),
        end: jest.fn()
      }
      PDFDocument.mockImplementation(() => mockDoc)

      mockDoc.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('PDF generation failed')), 0)
        }
        return mockDoc
      })

      const options = {
        format: 'pdf' as const
      }

      await expect(exportService.exportAsPDF('testuser', options))
        .rejects.toThrow('PDF generation failed')
    })
  })

  describe('export', () => {
    it('should route to correct export method based on format', async () => {
      const mockUser = createMockGitHubUser()
      mockGitHubService.getUser.mockResolvedValue(mockUser)

      // Test JSON export
      const jsonOptions = { format: 'json' as const }
      const jsonResult = await exportService.export('testuser', jsonOptions)
      expect(jsonResult).toBeInstanceOf(Buffer)

      // Test unsupported format
      const invalidOptions = { format: 'xml' as any }
      await expect(exportService.export('testuser', invalidOptions))
        .rejects.toThrow('Unsupported export format: xml')
    })
  })
})
