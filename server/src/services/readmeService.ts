// Load environment variables FIRST
import '@/config/env'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { GitHubService } from './githubService'
import { cacheService } from './cacheService'
import logger from '@/utils/logger'

export interface ReadmeAnalysis {
  repository_id: number
  repository_name: string
  has_readme: boolean
  current_readme_content?: string
  quality_score: number
  missing_sections: string[]
  suggestions: string[]
  generated_readme?: string
  last_analyzed: string
  language: string
  topics: string[]
  description: string
}

export interface ReadmeTemplate {
  id: string
  name: string
  description: string
  category: string
  template_content: string
  variables: {
    name: string
    description: string
    type: 'text' | 'boolean' | 'array'
    required: boolean
    default?: any
  }[]
}

export interface ReadmeGenerationRequest {
  repository_id: number
  template_id?: string
  custom_sections?: string[]
  include_badges?: boolean
  include_installation?: boolean
  include_usage?: boolean
  include_contributing?: boolean
  include_license?: boolean
  project_description?: string
  technologies?: string[]
}

export class ReadmeService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null
  private githubService: GitHubService

  constructor(githubService: GitHubService) {
    this.githubService = githubService

    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    } else {
      logger.warn('Gemini API key not provided. README generation will use templates only.')
    }
  }

  async analyzeRepositories(username: string): Promise<ReadmeAnalysis[]> {
    const cacheKey = `readme-analysis:${username}`
    
    const cached = await cacheService.get<ReadmeAnalysis[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const repositories = await this.githubService.getUserRepositories(username, {
        type: 'owner',
        sort: 'updated',
        per_page: 100
      })

      const analyses: ReadmeAnalysis[] = []

      for (const repo of repositories) {
        if (!repo.fork) { // Skip forked repositories
          const analysis = await this.analyzeRepository(repo)
          analyses.push(analysis)
        }
      }

      // Cache for 30 minutes
      await cacheService.set(cacheKey, analyses, { ttl: 1800 })

      return analyses
    } catch (error) {
      logger.error('Error analyzing repositories:', error)
      throw error
    }
  }

  async analyzeRepository(repository: any): Promise<ReadmeAnalysis> {
    try {
      // Check if README exists
      const readmeContent = await this.githubService.getRepositoryReadme(
        repository.owner.login,
        repository.name
      )

      const hasReadme = readmeContent !== null
      let currentContent = ''
      let qualityScore = 0
      const missingSections: string[] = []
      const suggestions: string[] = []

      if (hasReadme && readmeContent.content) {
        // Decode base64 content
        currentContent = Buffer.from(readmeContent.content, 'base64').toString('utf-8')
        
        // Analyze quality
        const analysis = this.analyzeReadmeQuality(currentContent, repository)
        qualityScore = analysis.score
        missingSections.push(...analysis.missingSections)
        suggestions.push(...analysis.suggestions)
      } else {
        missingSections.push(
          'Project Description',
          'Installation Instructions',
          'Usage Examples',
          'Contributing Guidelines',
          'License Information'
        )
        suggestions.push(
          'Add a comprehensive project description',
          'Include installation and setup instructions',
          'Provide usage examples and code snippets',
          'Add contributing guidelines for collaborators',
          'Include license information'
        )
      }

      return {
        repository_id: repository.id,
        repository_name: repository.name,
        has_readme: hasReadme,
        current_readme_content: currentContent,
        quality_score: qualityScore,
        missing_sections: missingSections,
        suggestions: suggestions,
        last_analyzed: new Date().toISOString(),
        language: repository.language || 'Unknown',
        topics: repository.topics || [],
        description: repository.description || ''
      }
    } catch (error) {
      logger.error(`Error analyzing repository ${repository.name}:`, error)
      
      // Return basic analysis on error
      return {
        repository_id: repository.id,
        repository_name: repository.name,
        has_readme: false,
        quality_score: 0,
        missing_sections: ['Analysis Error'],
        suggestions: ['Unable to analyze repository'],
        last_analyzed: new Date().toISOString(),
        language: repository.language || 'Unknown',
        topics: repository.topics || [],
        description: repository.description || ''
      }
    }
  }

  private analyzeReadmeQuality(content: string, repository: any): {
    score: number
    missingSections: string[]
    suggestions: string[]
  } {
    const sections = {
      title: /^#\s+.+/m,
      description: /(description|about|overview)/i,
      installation: /(install|setup|getting started)/i,
      usage: /(usage|example|how to)/i,
      contributing: /(contribut|development)/i,
      license: /license/i,
      badges: /\[!\[.*\]\(.*\)\]/,
      codeBlocks: /```[\s\S]*?```/g,
      links: /\[.*\]\(.*\)/g
    }

    let score = 0
    const missingSections: string[] = []
    const suggestions: string[] = []

    // Check for title (20 points)
    if (sections.title.test(content)) {
      score += 20
    } else {
      missingSections.push('Project Title')
      suggestions.push('Add a clear project title using # heading')
    }

    // Check for description (20 points)
    if (sections.description.test(content) || content.length > 100) {
      score += 20
    } else {
      missingSections.push('Project Description')
      suggestions.push('Add a detailed project description')
    }

    // Check for installation instructions (15 points)
    if (sections.installation.test(content)) {
      score += 15
    } else {
      missingSections.push('Installation Instructions')
      suggestions.push('Include installation and setup instructions')
    }

    // Check for usage examples (15 points)
    if (sections.usage.test(content)) {
      score += 15
    } else {
      missingSections.push('Usage Examples')
      suggestions.push('Add usage examples and code snippets')
    }

    // Check for contributing guidelines (10 points)
    if (sections.contributing.test(content)) {
      score += 10
    } else {
      missingSections.push('Contributing Guidelines')
      suggestions.push('Add contributing guidelines')
    }

    // Check for license (10 points)
    if (sections.license.test(content)) {
      score += 10
    } else {
      missingSections.push('License Information')
      suggestions.push('Include license information')
    }

    // Check for badges (5 points)
    if (sections.badges.test(content)) {
      score += 5
    } else {
      suggestions.push('Consider adding status badges')
    }

    // Check for code examples (5 points)
    const codeBlocks = content.match(sections.codeBlocks)
    if (codeBlocks && codeBlocks.length > 0) {
      score += 5
    } else {
      suggestions.push('Add code examples and snippets')
    }

    // Bonus points for comprehensive content
    if (content.length > 1000) score += 5
    if (content.length > 2000) score += 5

    return {
      score: Math.min(score, 100),
      missingSections,
      suggestions
    }
  }

  async generateReadme(
    username: string,
    request: ReadmeGenerationRequest
  ): Promise<string> {
    try {
      // Get repository information
      const repositories = await this.githubService.getUserRepositories(username)
      const repository = repositories.find(repo => repo.id === request.repository_id)
      
      if (!repository) {
        throw new Error('Repository not found')
      }

      let generatedReadme: string

      if (this.model && !request.template_id) {
        // Use AI to generate README
        generatedReadme = await this.generateAIReadme(repository, request)
      } else {
        // Use template-based generation
        generatedReadme = await this.generateTemplateReadme(repository, request)
      }

      return generatedReadme
    } catch (error) {
      logger.error('Error generating README:', error)
      throw error
    }
  }

  private async generateAIReadme(
    repository: any,
    request: ReadmeGenerationRequest
  ): Promise<string> {
    const prompt = `
    Generate a comprehensive, professional README.md file for this GitHub repository:

    Repository Information:
    - Name: ${repository.name}
    - Description: ${repository.description || 'No description provided'}
    - Language: ${repository.language || 'Unknown'}
    - Topics: ${repository.topics?.join(', ') || 'None'}
    - Stars: ${repository.stargazers_count}
    - Forks: ${repository.forks_count}

    User Preferences:
    - Include Badges: ${request.include_badges !== false}
    - Include Installation: ${request.include_installation !== false}
    - Include Usage: ${request.include_usage !== false}
    - Include Contributing: ${request.include_contributing !== false}
    - Include License: ${request.include_license !== false}
    - Technologies: ${request.technologies?.join(', ') || 'Infer from repository'}
    - Custom Description: ${request.project_description || 'Use repository description'}

    Requirements:
    1. Create a professional, well-structured README
    2. Include appropriate badges if requested
    3. Write clear, concise sections
    4. Use proper Markdown formatting
    5. Include code examples where appropriate
    6. Make it engaging and informative
    7. Follow best practices for README files

    Generate ONLY the README content in Markdown format, no additional text or explanations.
    `

    const result = await this.model!.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    if (!content) {
      throw new Error('No response from Gemini')
    }

    return content
  }

  private async generateTemplateReadme(
    repository: any,
    request: ReadmeGenerationRequest
  ): Promise<string> {
    const template = await this.getTemplate(request.template_id || 'basic')
    
    // Replace template variables
    let readme = template.template_content
    
    const variables = {
      PROJECT_NAME: repository.name,
      PROJECT_DESCRIPTION: request.project_description || repository.description || 'A great project',
      LANGUAGE: repository.language || 'JavaScript',
      TECHNOLOGIES: request.technologies?.join(', ') || repository.language || 'Various technologies',
      REPO_URL: repository.html_url,
      CLONE_URL: repository.clone_url,
      AUTHOR: repository.owner.login
    }

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      readme = readme.replace(regex, value)
    })

    // Add optional sections
    if (request.include_badges !== false) {
      readme = this.addBadges(readme, repository)
    }

    return readme
  }

  private addBadges(readme: string, repository: any): string {
    const badges = []
    
    // Language badge
    if (repository.language) {
      badges.push(`![${repository.language}](https://img.shields.io/badge/language-${repository.language}-blue)`)
    }
    
    // Stars badge
    badges.push(`![Stars](https://img.shields.io/github/stars/${repository.full_name})`)
    
    // Forks badge
    badges.push(`![Forks](https://img.shields.io/github/forks/${repository.full_name})`)
    
    // License badge
    if (repository.license) {
      badges.push(`![License](https://img.shields.io/github/license/${repository.full_name})`)
    }

    const badgeSection = badges.join(' ') + '\n\n'
    
    // Insert badges after the title
    const titleMatch = readme.match(/^(#\s+.+\n)/)
    if (titleMatch && titleMatch[1]) {
      return readme.replace(titleMatch[1] as string, (titleMatch[1] as string) + '\n' + badgeSection)
    } else {
      return badgeSection + readme
    }
  }

  async getTemplates(): Promise<ReadmeTemplate[]> {
    // In a real app, these would be stored in a database
    return [
      {
        id: 'basic',
        name: 'Basic Project',
        description: 'Simple README for basic projects',
        category: 'General',
        template_content: this.getBasicTemplate(),
        variables: [
          { name: 'PROJECT_NAME', description: 'Name of the project', type: 'text', required: true },
          { name: 'PROJECT_DESCRIPTION', description: 'Project description', type: 'text', required: true },
          { name: 'LANGUAGE', description: 'Primary programming language', type: 'text', required: false },
        ]
      },
      {
        id: 'web-app',
        name: 'Web Application',
        description: 'Template for web applications with deployment info',
        category: 'Web Development',
        template_content: this.getWebAppTemplate(),
        variables: [
          { name: 'PROJECT_NAME', description: 'Name of the web application', type: 'text', required: true },
          { name: 'PROJECT_DESCRIPTION', description: 'Application description', type: 'text', required: true },
          { name: 'TECHNOLOGIES', description: 'Technologies used', type: 'array', required: true },
        ]
      },
      {
        id: 'library',
        name: 'Library/Package',
        description: 'Documentation for reusable libraries',
        category: 'Library',
        template_content: this.getLibraryTemplate(),
        variables: [
          { name: 'PROJECT_NAME', description: 'Library name', type: 'text', required: true },
          { name: 'PROJECT_DESCRIPTION', description: 'Library description', type: 'text', required: true },
          { name: 'LANGUAGE', description: 'Programming language', type: 'text', required: true },
        ]
      }
    ]
  }

  async getTemplate(id: string): Promise<ReadmeTemplate> {
    const templates = await this.getTemplates()
    const template = templates.find(t => t.id === id)
    
    if (!template) {
      throw new Error(`Template ${id} not found`)
    }
    
    return template
  }

  private getBasicTemplate(): string {
    return `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}
# Add installation steps here
\`\`\`

## Usage

\`\`\`{{LANGUAGE}}
// Add usage examples here
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by [{{AUTHOR}}](https://github.com/{{AUTHOR}})
`
  }

  private getWebAppTemplate(): string {
    return `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 🚀 Technologies Used

{{TECHNOLOGIES}}

## ✨ Features

- Feature 1
- Feature 2
- Feature 3

## 🛠️ Installation

\`\`\`bash
# Clone the repository
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# Install dependencies
npm install

# Start the development server
npm start
\`\`\`

## 🎯 Usage

1. Open your browser and navigate to the application URL
2. Follow the on-screen instructions
3. Enjoy using the application!

## 🌐 Deployment

This application can be deployed to various platforms:

- **Vercel**: \`vercel --prod\`
- **Netlify**: Connect your GitHub repository
- **Heroku**: \`git push heroku main\`

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**{{AUTHOR}}**
- GitHub: [@{{AUTHOR}}](https://github.com/{{AUTHOR}})
`
  }

  private getLibraryTemplate(): string {
    return `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Installation

\`\`\`bash
npm install {{PROJECT_NAME}}
\`\`\`

## Quick Start

\`\`\`{{LANGUAGE}}
// Import the library
import { functionName } from '{{PROJECT_NAME}}';

// Use the library
const result = functionName();
console.log(result);
\`\`\`

## API Reference

### \`functionName()\`

Description of the function.

**Parameters:**
- \`param1\` (string): Description of parameter 1
- \`param2\` (number): Description of parameter 2

**Returns:**
- \`ReturnType\`: Description of return value

**Example:**
\`\`\`{{LANGUAGE}}
const result = functionName('example', 42);
\`\`\`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`
  }

  async publishReadme(
    username: string,
    repositoryName: string,
    readmeContent: string,
    commitMessage: string = 'Add/Update README.md'
  ): Promise<any> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Publishing README for ${username}/${repositoryName} (attempt ${attempt}/${maxRetries})`)

        // Validate inputs
        if (!username || !repositoryName || !readmeContent) {
          throw new Error('Missing required parameters: username, repositoryName, or readmeContent')
        }

        if (readmeContent.trim().length === 0) {
          throw new Error('README content cannot be empty')
        }

        // Check if README already exists
        let existingReadme: any = null
        try {
          existingReadme = await this.githubService.getFileContent(
            username,
            repositoryName,
            'README.md'
          )
          logger.info(`Found existing README for ${username}/${repositoryName}`)
        } catch (error: any) {
          if (error.response?.status === 404) {
            logger.info(`No existing README found for ${username}/${repositoryName}, will create new one`)
          } else {
            logger.warn(`Error checking for existing README: ${error.message}`)
            // Continue anyway, createOrUpdateFile will handle it
          }
        }

        // Create or update the README
        const result = await this.githubService.createOrUpdateFile(
          username,
          repositoryName,
          'README.md',
          readmeContent,
          commitMessage,
          existingReadme?.sha
        )

        logger.info(`README published successfully for ${username}/${repositoryName}`)

        return {
          ...result,
          repository_url: `https://github.com/${username}/${repositoryName}`,
          readme_url: `https://github.com/${username}/${repositoryName}/blob/main/README.md`,
          action: existingReadme ? 'updated' : 'created'
        }

      } catch (error: any) {
        lastError = error
        logger.error(`Error publishing README for ${username}/${repositoryName} (attempt ${attempt}):`, error)

        // Don't retry for certain errors
        if (error.response) {
          const status = error.response.status

          // Don't retry for client errors (4xx) except rate limiting
          if (status >= 400 && status < 500 && status !== 429) {
            logger.error(`Non-retryable error (${status}), aborting retry attempts`)
            break
          }

          // For rate limiting, wait before retrying
          if (status === 429) {
            const retryAfter = error.response.headers['retry-after']
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
            logger.info(`Rate limited, waiting ${waitTime}ms before retry`)
            await this.sleep(waitTime)
            continue
          }
        }

        // For other errors, wait with exponential backoff
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
          logger.info(`Waiting ${waitTime}ms before retry attempt ${attempt + 1}`)
          await this.sleep(waitTime)
        }
      }
    }

    // If we get here, all retries failed
    logger.error(`Failed to publish README for ${username}/${repositoryName} after ${maxRetries} attempts`)

    // Enhance error message based on the last error
    if (lastError.response) {
      const { status, data } = lastError.response
      switch (status) {
        case 401:
          throw new Error('Authentication failed. Please check your GitHub access token.')
        case 403:
          if (data?.message?.includes('rate limit')) {
            throw new Error('GitHub API rate limit exceeded. Please try again later.')
          }
          throw new Error('Permission denied. You may not have write access to this repository.')
        case 404:
          throw new Error('Repository not found or you do not have access to it.')
        case 422:
          throw new Error('Invalid request. The repository may be empty or the file path is invalid.')
        default:
          throw new Error(`GitHub API error (${status}): ${data?.message || lastError.message}`)
      }
    }

    throw lastError
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  isAIEnabled(): boolean {
    return this.model !== null
  }
}

export const createReadmeService = (githubService: GitHubService): ReadmeService => {
  return new ReadmeService(githubService)
}
