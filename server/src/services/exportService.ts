// Load environment variables FIRST
import '@/config/env'

import PDFDocument from 'pdfkit'
import { createObjectCsvWriter } from 'csv-writer'
import * as XLSX from 'xlsx'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import path from 'path'
import fs from 'fs/promises'
import { GitHubService } from './githubService'
import { AnalyticsService } from './analyticsService'
import { AIService } from './aiService'
import logger from '@/utils/logger'

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'xlsx' | 'xml'
  includeRecommendations?: boolean
  includeAnalytics?: boolean
  includeRepositories?: boolean
  includeContributions?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

export interface ExportData {
  user: any
  analytics?: any
  repositories?: any[]
  recommendations?: any
  contributions?: any[]
  exportedAt: string
  metadata: {
    version: string
    format: string
    options: ExportOptions
  }
}

export class ExportService {
  private githubService: GitHubService
  private analyticsService: AnalyticsService
  private aiService: AIService

  constructor(accessToken: string) {
    this.githubService = new GitHubService(accessToken)
    this.analyticsService = new AnalyticsService(this.githubService)
    this.aiService = new AIService(this.githubService)
  }

  /**
   * Generate comprehensive export data
   */
  async generateExportData(username: string, options: ExportOptions): Promise<ExportData> {
    try {
      logger.info(`Generating export data for ${username}`, { options })

      // Get user profile
      const user = await this.githubService.getUser()

      const exportData: ExportData = {
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          company: user.company,
          location: user.location,
          blog: user.blog,
          twitter_username: user.twitter_username,
          public_repos: user.public_repos,
          followers: user.followers,
          following: user.following,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        exportedAt: new Date().toISOString(),
        metadata: {
          version: '1.0.0',
          format: options.format,
          options
        }
      }

      // Include analytics if requested
      if (options.includeAnalytics) {
        exportData.analytics = await this.analyticsService.getProfileScore(username)
      }

      // Include repositories if requested
      if (options.includeRepositories) {
        const repositories = await this.githubService.getUserRepositories(username)
        exportData.repositories = repositories.map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          private: repo.private,
          html_url: repo.html_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          watchers_count: repo.watchers_count,
          forks_count: repo.forks_count,
          size: repo.size,
          topics: repo.topics,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at
        }))
      }

      // Include recommendations if requested
      if (options.includeRecommendations) {
        try {
          const userProfile = await this.githubService.getUser()
          const repositories = await this.githubService.getUserRepositories(username)
          
          const [projectRecommendations, technologyRecommendations] = await Promise.all([
            this.aiService.generateProjectRecommendations(username, userProfile, repositories),
            this.aiService.generateTechnologyRecommendations(username, userProfile, repositories)
          ])

          exportData.recommendations = {
            projects: projectRecommendations,
            technologies: technologyRecommendations,
            generated_at: new Date().toISOString()
          }
        } catch (error) {
          logger.warn('Failed to generate recommendations for export:', error)
          exportData.recommendations = {
            error: 'Failed to generate recommendations',
            generated_at: new Date().toISOString()
          }
        }
      }

      // Include contributions if requested
      if (options.includeContributions) {
        try {
          // This would typically come from GitHub's GraphQL API
          // For now, we'll include a placeholder
          exportData.contributions = [{
            date: new Date().toISOString().split('T')[0],
            count: 0,
            note: 'Contribution data requires GitHub GraphQL API integration'
          }]
        } catch (error) {
          logger.warn('Failed to get contributions for export:', error)
        }
      }

      return exportData
    } catch (error) {
      logger.error('Error generating export data:', error)
      throw error
    }
  }

  /**
   * Export data as JSON
   */
  async exportAsJSON(username: string, options: ExportOptions): Promise<Buffer> {
    try {
      const data = await this.generateExportData(username, options)
      return Buffer.from(JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      logger.error('Error exporting as JSON:', error)
      throw error
    }
  }

  /**
   * Export data as CSV
   */
  async exportAsCSV(username: string, options: ExportOptions): Promise<Buffer> {
    try {
      const data = await this.generateExportData(username, options)
      
      // Create temporary file path
      const tempDir = path.join(process.cwd(), 'temp')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFile = path.join(tempDir, `export-${Date.now()}.csv`)

      // Prepare CSV data - flatten the structure
      const csvData = []

      // User data
      csvData.push({
        type: 'user',
        id: data.user.id,
        name: data.user.name,
        login: data.user.login,
        email: data.user.email,
        company: data.user.company,
        location: data.user.location,
        public_repos: data.user.public_repos,
        followers: data.user.followers,
        following: data.user.following,
        created_at: data.user.created_at
      })

      // Repository data
      if (data.repositories) {
        data.repositories.forEach(repo => {
          csvData.push({
            type: 'repository',
            id: repo.id,
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            size: repo.size,
            created_at: repo.created_at,
            updated_at: repo.updated_at
          })
        })
      }

      // Analytics data
      if (data.analytics) {
        csvData.push({
          type: 'analytics',
          overall_score: data.analytics.overall_score,
          repository_quality: data.analytics.repository_quality,
          contribution_consistency: data.analytics.contribution_consistency,
          community_engagement: data.analytics.community_engagement,
          documentation_completeness: data.analytics.documentation_completeness
        })
      }

      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: tempFile,
        header: Object.keys(csvData[0] || {}).map(key => ({ id: key, title: key }))
      })

      await csvWriter.writeRecords(csvData)
      
      // Read file and clean up
      const buffer = await fs.readFile(tempFile)
      await fs.unlink(tempFile)
      
      return buffer
    } catch (error) {
      logger.error('Error exporting as CSV:', error)
      throw error
    }
  }

  /**
   * Export data as PDF report
   */
  async exportAsPDF(username: string, options: ExportOptions): Promise<Buffer> {
    try {
      const data = await this.generateExportData(username, options)
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 })
        const chunks: Buffer[] = []

        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        // Header
        doc.fontSize(24).text('GitHub Profile Analytics Report', { align: 'center' })
        doc.moveDown()

        // User Information
        doc.fontSize(18).text('Profile Information', { underline: true })
        doc.moveDown(0.5)
        doc.fontSize(12)
        doc.text(`Name: ${data.user.name || 'N/A'}`)
        doc.text(`Username: ${data.user.login}`)
        doc.text(`Email: ${data.user.email || 'N/A'}`)
        doc.text(`Company: ${data.user.company || 'N/A'}`)
        doc.text(`Location: ${data.user.location || 'N/A'}`)
        doc.text(`Public Repositories: ${data.user.public_repos}`)
        doc.text(`Followers: ${data.user.followers}`)
        doc.text(`Following: ${data.user.following}`)
        doc.text(`Member Since: ${new Date(data.user.created_at).toLocaleDateString()}`)
        doc.moveDown()

        // Analytics
        if (data.analytics) {
          doc.fontSize(18).text('Analytics Summary', { underline: true })
          doc.moveDown(0.5)
          doc.fontSize(12)
          doc.text(`Overall Score: ${data.analytics.overall_score}/100`)
          doc.text(`Repository Quality: ${data.analytics.repository_quality}/100`)
          doc.text(`Contribution Consistency: ${data.analytics.contribution_consistency}/100`)
          doc.text(`Community Engagement: ${data.analytics.community_engagement}/100`)
          doc.text(`Documentation Completeness: ${data.analytics.documentation_completeness}/100`)
          doc.moveDown()
        }

        // Repositories
        if (data.repositories && data.repositories.length > 0) {
          doc.fontSize(18).text('Top Repositories', { underline: true })
          doc.moveDown(0.5)
          doc.fontSize(12)
          
          data.repositories.slice(0, 10).forEach((repo, index) => {
            doc.text(`${index + 1}. ${repo.name}`)
            doc.text(`   Language: ${repo.language || 'N/A'}`)
            doc.text(`   Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}`)
            doc.text(`   Description: ${repo.description || 'No description'}`)
            doc.moveDown(0.3)
          })
          doc.moveDown()
        }

        // Recommendations
        if (data.recommendations && data.recommendations.projects) {
          doc.fontSize(18).text('AI Recommendations', { underline: true })
          doc.moveDown(0.5)
          doc.fontSize(12)
          
          if (data.recommendations.projects.length > 0) {
            doc.text('Project Recommendations:')
            data.recommendations.projects.slice(0, 5).forEach((project: any, index: number) => {
              doc.text(`${index + 1}. ${project.title}`)
              doc.text(`   Difficulty: ${project.difficulty}`)
              doc.text(`   Technologies: ${project.technologies.join(', ')}`)
              doc.moveDown(0.3)
            })
          }
        }

        // Footer
        doc.fontSize(10).text(
          `Report generated on ${new Date(data.exportedAt).toLocaleString()}`,
          { align: 'center' }
        )

        doc.end()
      })
    } catch (error) {
      logger.error('Error exporting as PDF:', error)
      throw error
    }
  }

  /**
   * Generate export based on format
   */
  async export(username: string, options: ExportOptions): Promise<Buffer> {
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(username, options)
      case 'csv':
        return this.exportAsCSV(username, options)
      case 'pdf':
        return this.exportAsPDF(username, options)
      case 'xlsx':
        return this.exportAsXLSX(username, options)
      case 'xml':
        return this.exportAsXML(username, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * Export data as Excel (XLSX) format
   */
  private async exportAsXLSX(username: string, options: ExportOptions): Promise<Buffer> {
    const data = await this.generateExportData(username, options)

    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Profile sheet
    const profileData = [
      ['Field', 'Value'],
      ['Username', data.user.login],
      ['Name', data.user.name || ''],
      ['Bio', data.user.bio || ''],
      ['Company', data.user.company || ''],
      ['Location', data.user.location || ''],
      ['Public Repos', data.user.public_repos],
      ['Followers', data.user.followers],
      ['Following', data.user.following],
      ['Created At', data.user.created_at],
      ['Updated At', data.user.updated_at]
    ]
    const profileSheet = XLSX.utils.aoa_to_sheet(profileData)
    XLSX.utils.book_append_sheet(workbook, profileSheet, 'Profile')

    // Repositories sheet
    if (data.repositories && data.repositories.length > 0) {
      const repoHeaders = ['Name', 'Description', 'Language', 'Stars', 'Forks', 'Created', 'Updated']
      const repoData = [
        repoHeaders,
        ...data.repositories.map((repo: any) => [
          repo.name,
          repo.description || '',
          repo.language || '',
          repo.stargazers_count,
          repo.forks_count,
          repo.created_at,
          repo.updated_at
        ])
      ]
      const repoSheet = XLSX.utils.aoa_to_sheet(repoData)
      XLSX.utils.book_append_sheet(workbook, repoSheet, 'Repositories')
    }

    // Analytics sheet
    if (data.analytics) {
      const analyticsData = [
        ['Metric', 'Value'],
        ['Overall Score', data.analytics.overall_score || 0],
        ['Activity Score', data.analytics.activity_score || 0],
        ['Quality Score', data.analytics.quality_score || 0],
        ['Impact Score', data.analytics.impact_score || 0],
        ['Consistency Score', data.analytics.consistency_score || 0]
      ]
      const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData)
      XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics')
    }

    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    return Buffer.from(buffer)
  }

  /**
   * Export data as XML format
   */
  private async exportAsXML(username: string, options: ExportOptions): Promise<Buffer> {
    const data = await this.generateExportData(username, options)

    // Build XML structure
    const xmlData = {
      github_profile: {
        '@_exported_at': data.exportedAt,
        '@_version': data.metadata.version,
        user: {
          login: data.user.login,
          name: data.user.name || '',
          bio: data.user.bio || '',
          company: data.user.company || '',
          location: data.user.location || '',
          email: data.user.email || '',
          public_repos: data.user.public_repos,
          followers: data.user.followers,
          following: data.user.following,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at
        },
        ...(data.repositories && {
          repositories: {
            repository: data.repositories.map((repo: any) => ({
              '@_id': repo.id,
              name: repo.name,
              description: repo.description || '',
              language: repo.language || '',
              stargazers_count: repo.stargazers_count,
              forks_count: repo.forks_count,
              created_at: repo.created_at,
              updated_at: repo.updated_at,
              private: repo.private
            }))
          }
        }),
        ...(data.analytics && {
          analytics: {
            overall_score: data.analytics.overall_score || 0,
            activity_score: data.analytics.activity_score || 0,
            quality_score: data.analytics.quality_score || 0,
            impact_score: data.analytics.impact_score || 0,
            consistency_score: data.analytics.consistency_score || 0
          }
        }),
        ...(data.recommendations && {
          recommendations: {
            technology: data.recommendations.technologies || [],
            project: data.recommendations.projects || []
          }
        })
      }
    }

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      indentBy: '  '
    })

    const xmlString = builder.build(xmlData)
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n${xmlString}`, 'utf-8')
  }
}
