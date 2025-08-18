import { Response } from 'express'
import { AuthenticatedRequest } from '@/middleware/authMiddleware'
import { createGitHubService } from '@/services/githubService'
import { createReadmeService } from '@/services/readmeService'
import logger from '@/utils/logger'

export const analyzeRepositories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    const githubService = createGitHubService()
    const readmeService = createReadmeService(githubService)

    const analyses = await readmeService.analyzeRepositories(login)

    res.json({
      success: true,
      data: {
        analyses,
        total_repositories: analyses.length,
        repositories_with_readme: analyses.filter(a => a.has_readme).length,
        average_quality_score: analyses.length > 0
          ? Math.round(analyses.reduce((sum, a) => sum + a.quality_score, 0) / analyses.length)
          : 0
      }
    })
  } catch (error) {
    logger.error('Error analyzing repositories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze repositories'
    })
  }
}

export const analyzeRepository = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { repoId } = req.params
    // TODO: Implement single repository analysis
    res.json({
      success: true,
      data: {
        message: `Repository ${repoId} analysis endpoint - to be implemented`
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze repository'
    })
  }
}

export const generateReadme = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!
    const {
      repository_id,
      template_id,
      custom_sections,
      include_badges,
      include_installation,
      include_usage,
      include_contributing,
      include_license,
      project_description,
      technologies
    } = req.body

    if (!repository_id) {
      return res.status(400).json({
        success: false,
        error: 'Repository ID is required'
      })
    }

    const githubService = createGitHubService()
    const readmeService = createReadmeService(githubService)

    const generatedReadme = await readmeService.generateReadme(login, {
      repository_id,
      template_id,
      custom_sections,
      include_badges,
      include_installation,
      include_usage,
      include_contributing,
      include_license,
      project_description,
      technologies
    })

    res.json({
      success: true,
      data: {
        readme_content: generatedReadme,
        ai_enabled: readmeService.isAIEnabled()
      }
    })
  } catch (error) {
    logger.error('Error generating README:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate README'
    })
  }
}

export const getTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const githubService = createGitHubService()
    const readmeService = createReadmeService(githubService)

    const templates = await readmeService.getTemplates()

    res.json({
      success: true,
      data: {
        templates,
        total_count: templates.length
      }
    })
  } catch (error) {
    logger.error('Error getting templates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    })
  }
}

export const getTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    // TODO: Implement single template retrieval
    res.json({
      success: true,
      data: {
        message: `Template ${id} endpoint - to be implemented`
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get template'
    })
  }
}

export const publishReadme = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login, access_token } = req.user!
    const { repository_name, readme_content, commit_message } = req.body

    // Validate required fields
    if (!repository_name || !readme_content) {
      return res.status(400).json({
        success: false,
        error: 'Repository name and README content are required'
      })
    }

    // Validate repository name format
    if (!/^[a-zA-Z0-9._-]+$/.test(repository_name)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid repository name format'
      })
    }

    // Validate README content length
    if (readme_content.length > 1000000) { // 1MB limit
      return res.status(400).json({
        success: false,
        error: 'README content is too large (max 1MB)'
      })
    }

    // Create GitHub service with user's access token
    const githubService = createGitHubService(access_token)
    const readmeService = createReadmeService(githubService)

    // Check if user has write access to the repository
    try {
      const repo = await githubService.getRepository(login, repository_name)
      if (!repo) {
        return res.status(404).json({
          success: false,
          error: 'Repository not found or you do not have access to it'
        })
      }

      // Check if user has push permissions
      if (!repo.permissions?.push) {
        return res.status(403).json({
          success: false,
          error: 'You do not have write access to this repository'
        })
      }
    } catch (repoError: any) {
      logger.error('Repository access check failed:', repoError)
      if (repoError.response?.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Repository not found or you do not have access to it'
        })
      }
      if (repoError.response?.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'You do not have sufficient permissions to access this repository'
        })
      }
      throw repoError
    }

    // Publish the README
    const result = await readmeService.publishReadme(
      login,
      repository_name,
      readme_content,
      commit_message || 'Add/Update README.md via GitHub Analytics Platform'
    )

    logger.info(`README published successfully for ${login}/${repository_name}`)

    res.json({
      success: true,
      data: {
        commit: result,
        message: 'README published successfully',
        repository_url: `https://github.com/${login}/${repository_name}`,
        readme_url: `https://github.com/${login}/${repository_name}/blob/main/README.md`
      }
    })

  } catch (error: any) {
    logger.error('Publish README error:', error)

    // Handle specific GitHub API errors
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          return res.status(401).json({
            success: false,
            error: 'Authentication failed. Please re-authenticate with GitHub.'
          })
        case 403:
          if (data?.message?.includes('rate limit')) {
            return res.status(429).json({
              success: false,
              error: 'GitHub API rate limit exceeded. Please try again later.'
            })
          }
          return res.status(403).json({
            success: false,
            error: 'Permission denied. You may not have write access to this repository.'
          })
        case 404:
          return res.status(404).json({
            success: false,
            error: 'Repository not found or you do not have access to it.'
          })
        case 422:
          return res.status(422).json({
            success: false,
            error: 'Invalid request. The repository may be empty or the file path is invalid.'
          })
        default:
          return res.status(status).json({
            success: false,
            error: data?.message || 'GitHub API error occurred'
          })
      }
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Unable to connect to GitHub. Please check your internet connection and try again.'
      })
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish README. Please try again later.'
    })
  }
}

export const validateRepositoryAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login, access_token } = req.user!
    const { repository_name } = req.params

    if (!repository_name) {
      return res.status(400).json({
        success: false,
        error: 'Repository name is required'
      })
    }

    // Validate repository name format
    if (!/^[a-zA-Z0-9._-]+$/.test(repository_name)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid repository name format'
      })
    }

    const githubService = createGitHubService(access_token)
    const validation = await githubService.validateRepositoryAccess(login, repository_name)

    res.json({
      success: true,
      data: {
        repository_name,
        has_access: validation.hasAccess,
        has_write_access: validation.hasWriteAccess,
        repository_url: validation.repository ? `https://github.com/${login}/${repository_name}` : null,
        error: validation.error
      }
    })

  } catch (error: any) {
    logger.error('Validate repository access error:', error)

    if (error.response) {
      const { status, data } = error.response
      return res.status(status).json({
        success: false,
        error: data?.message || 'GitHub API error occurred'
      })
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate repository access'
    })
  }
}
