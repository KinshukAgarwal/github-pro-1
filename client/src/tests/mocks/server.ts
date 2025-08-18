import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { createMockUser, createMockRepository, createMockAnalytics } from '../setup'

// Mock API handlers
export const handlers = [
  // Auth endpoints
  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          error: 'Access token required'
        })
      )
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: createMockUser()
        }
      })
    )
  }),

  rest.post('/api/auth/refresh', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          access_token: 'new-access-token',
          expires_in: 3600
        }
      })
    )
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      })
    )
  }),

  // User endpoints
  rest.get('/api/user/:username', (req, res, ctx) => {
    const { username } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: createMockUser({ login: username })
      })
    )
  }),

  rest.get('/api/user/:username/repositories', (req, res, ctx) => {
    const { username } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          createMockRepository({ name: 'repo1' }),
          createMockRepository({ name: 'repo2' }),
          createMockRepository({ name: 'repo3' })
        ]
      })
    )
  }),

  // Analytics endpoints
  rest.get('/api/analytics/:username/score', (req, res, ctx) => {
    const { username } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: createMockAnalytics()
      })
    )
  }),

  rest.get('/api/analytics/:username/repositories', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          total_repos: 10,
          total_stars: 100,
          total_forks: 25,
          average_stars: 10,
          most_starred: createMockRepository({ stargazers_count: 50 })
        }
      })
    )
  }),

  rest.get('/api/analytics/:username/languages', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          { name: 'TypeScript', percentage: 60, bytes: 120000 },
          { name: 'JavaScript', percentage: 30, bytes: 60000 },
          { name: 'Python', percentage: 10, bytes: 20000 }
        ]
      })
    )
  }),

  // Recommendations endpoints
  rest.get('/api/recommendations/:username/projects', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          {
            title: 'Build a REST API',
            description: 'Create a RESTful API using Node.js and Express',
            difficulty: 'intermediate',
            technologies: ['Node.js', 'Express', 'MongoDB'],
            learning_objectives: ['API design', 'Database integration', 'Authentication'],
            estimated_time: '2-3 weeks',
            resources: [
              { title: 'Express.js Guide', url: 'https://expressjs.com/guide' }
            ]
          },
          {
            title: 'React Dashboard',
            description: 'Build a responsive dashboard with React and TypeScript',
            difficulty: 'advanced',
            technologies: ['React', 'TypeScript', 'Chart.js'],
            learning_objectives: ['Component architecture', 'State management', 'Data visualization'],
            estimated_time: '3-4 weeks',
            resources: [
              { title: 'React Documentation', url: 'https://react.dev' }
            ]
          }
        ]
      })
    )
  }),

  rest.get('/api/recommendations/:username/technologies', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          {
            name: 'TypeScript',
            category: 'Programming Language',
            demand_score: 95,
            learning_curve: 'moderate',
            market_trend: 'rising',
            salary_impact: '+15%',
            description: 'Strongly typed JavaScript for better development experience',
            learning_path: [
              'Basic TypeScript syntax',
              'Advanced types and generics',
              'Integration with React/Node.js'
            ],
            resources: [
              { title: 'TypeScript Handbook', url: 'https://typescriptlang.org/docs' }
            ]
          }
        ]
      })
    )
  }),

  // README endpoints
  rest.get('/api/readme/:username/analyze', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          {
            repository: 'test-repo',
            score: 75,
            has_readme: true,
            readme_quality: 'good',
            missing_sections: ['installation', 'contributing'],
            suggestions: [
              'Add installation instructions',
              'Include contributing guidelines',
              'Add badges for build status'
            ]
          }
        ]
      })
    )
  }),

  rest.post('/api/readme/:username/:repository/generate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          content: '# Test Repository\n\nA comprehensive README for your project.\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Usage\n\n```bash\nnpm start\n```',
          sections: ['title', 'description', 'installation', 'usage'],
          quality_score: 90
        }
      })
    )
  }),

  // Export endpoints
  rest.get('/api/export/formats', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
            }
          ]
        }
      })
    )
  }),

  rest.post('/api/export/profile', (req, res, ctx) => {
    // Simulate file download
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'application/json'),
      ctx.set('Content-Disposition', 'attachment; filename="profile-export.json"'),
      ctx.body(JSON.stringify({ exported: true, timestamp: new Date().toISOString() }))
    )
  }),

  rest.post('/api/export/share', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          share_url: 'https://example.com/share/abc123',
          share_token: 'abc123',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          settings: {
            includePrivateData: false,
            allowedDomains: []
          }
        }
      })
    )
  }),

  rest.get('/api/export/social', (req, res, ctx) => {
    const platform = req.url.searchParams.get('platform') || 'twitter'
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          platform,
          content: {
            text: 'Check out my GitHub profile analytics! 🚀',
            url: 'https://github-analytics.com/profile/testuser'
          },
          share_urls: {
            twitter: 'https://twitter.com/intent/tweet?text=Check%20out%20my%20GitHub%20profile%20analytics!%20🚀&url=https://github-analytics.com/profile/testuser',
            linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=https://github-analytics.com/profile/testuser',
            facebook: 'https://www.facebook.com/sharer/sharer.php?u=https://github-analytics.com/profile/testuser'
          }
        }
      })
    )
  }),

  // Error handlers for testing error states
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: 'Internal server error'
      })
    )
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: 'Not found'
      })
    )
  }),

  rest.get('/api/error/rate-limit', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: 60
      })
    )
  })
]

// Setup server
export const server = setupServer(...handlers)
