import { Response } from 'express'
import { AuthenticatedRequest } from '@/middleware/authMiddleware'
import { createGitHubService } from '@/services/githubService'
import { createAIService } from '@/services/aiService'
import { createCareerInsightsService } from '@/services/careerInsightsService'
import { createAnalyticsService } from '@/services/analyticsService'
import logger from '@/utils/logger'
import { readUserData, writeUserData } from '@/services/fileStore'

export const getProjectRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!
    const { difficulty, time_commitment, focus_areas } = req.query

    const githubService = createGitHubService(req.user?.access_token)
    const aiService = createAIService(githubService)

    // Get user profile and repositories (authenticated for private/collab repos)
    const userProfile = await githubService.getUser(login)
    const repositories = await githubService.getAuthenticatedUserRepositories({
      type: 'all',
      sort: 'updated',
      per_page: 100
    })

    const preferences = {
      difficulty: difficulty as any,
      time_commitment: time_commitment as any,
      focus_areas: focus_areas ? (focus_areas as string).split(',') : undefined
    }

    const recommendations = await aiService.generateProjectRecommendations(
      login,
      userProfile,
      repositories,
      preferences
    )

    res.json({
      success: true,
      data: {
        recommendations,
        ai_enabled: aiService.isAIEnabled(),
        total_count: recommendations.length
      }
    })
  } catch (error) {
    logger.error('Error getting project recommendations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get project recommendations'
    })
  }
}

export const getTechnologyRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    const githubService = createGitHubService(req.user?.access_token)
    const aiService = createAIService(githubService)

    // Get user profile and repositories (authenticated for private/collab repos)
    const userProfile = await githubService.getUser(login)
    const repositories = await githubService.getAuthenticatedUserRepositories({
      type: 'all',
      sort: 'updated',
      per_page: 100
    })

    const recommendations = await aiService.generateTechnologyRecommendations(
      login,
      userProfile,
      repositories
    )

    res.json({
      success: true,
      data: {
        recommendations,
        ai_enabled: aiService.isAIEnabled(),
        total_count: recommendations.length
      }
    })
  } catch (error) {
    logger.error('Error getting technology recommendations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get technology recommendations'
    })
  }
}

export const getCareerInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    const githubService = createGitHubService(req.user?.access_token)
    const careerService = createCareerInsightsService(githubService)
    const analyticsService = createAnalyticsService(githubService)

    // Get user data with robust fallbacks
    let userProfile: any = null
    try {
      userProfile = await githubService.getUser(login)
    } catch {}
    let repositories: any[] = []
    try {
      repositories = await githubService.getAuthenticatedUserRepositories({ type: 'all', sort: 'updated', per_page: 100 })
    } catch {}
    const profileScore = await analyticsService.calculateProfileScore(login)

    const insights = await careerService.generateCareerInsights(login)

    res.json({
      success: true,
      data: insights
    })
  } catch (error) {
    logger.error('Error getting career insights:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get career insights'
    })
  }
}

export const generateRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implement recommendation generation
    res.json({
      success: true,
      data: {
        message: 'Generate recommendations endpoint - to be implemented'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    })
  }
}

// Roadmap store using file persistence (falls back gracefully)
import { randomUUID } from 'crypto'

export const getRoadmap = async (req: AuthenticatedRequest, res: Response) => {
  const login = req.user!.login
  const items = await readUserData<any[]>('roadmap', login, [])
  res.json({ success: true, data: items })
}

export const addRoadmapItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const login = req.user!.login
    const items = await readUserData<any[]>('roadmap', login, [])
    const now = new Date().toISOString()

    const item = {
      id: randomUUID(),
      type: req.body?.type || 'technology',
      name: req.body?.name,
      status: req.body?.status || 'not-started',
      meta: {
        ...req.body?.meta,
        learning_path: req.body?.meta?.learning_path || generateLearningPath(req.body?.name, req.body?.type),
        time_to_proficiency: req.body?.meta?.time_to_proficiency || estimateTimeToLearn(req.body?.name, req.body?.type),
        difficulty: req.body?.meta?.difficulty || 'intermediate',
        prerequisites: req.body?.meta?.prerequisites || []
      },
      progress: req.body?.progress || { completedSteps: [], percent: 0 },
      dependencies: req.body?.dependencies || [],
      milestones: req.body?.milestones || generateMilestones(req.body?.name, req.body?.type),
      target_date: req.body?.target_date || null,
      created_at: now,
      updated_at: now
    }

    const next = [...items, item]
    await writeUserData('roadmap', login, next)
    res.json({ success: true, data: item })
  } catch (error) {
    logger.error('Error adding roadmap item:', error)
    res.status(500).json({ success: false, error: 'Failed to add roadmap item' })
  }
}

export const updateRoadmapItem = async (req: AuthenticatedRequest, res: Response) => {
  const login = req.user!.login
  const items = await readUserData<any[]>('roadmap', login, [])
  const idx = items.findIndex(i => i.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' })

  const patch = req.body || {}
  const updated = { ...items[idx], ...patch, updated_at: new Date().toISOString() }
  // recompute percent if completedSteps and meta.learning_path present
  try {
    const total = Array.isArray(updated?.meta?.learning_path) ? updated.meta.learning_path.length : 0
    const completed = Array.isArray(updated?.progress?.completedSteps) ? updated.progress.completedSteps.length : 0
    updated.progress = { ...(updated.progress || {}), percent: total > 0 ? Math.round((completed / total) * 100) : (updated.progress?.percent || 0) }
  } catch {}

  items[idx] = updated
  await writeUserData('roadmap', login, items)
  res.json({ success: true, data: updated })
}

export const removeRoadmapItem = async (req: AuthenticatedRequest, res: Response) => {
  const login = req.user!.login
  const items = await readUserData<any[]>('roadmap', login, [])
  const next = items.filter(i => i.id !== req.params.id)
  await writeUserData('roadmap', login, next)
  res.json({ success: true, data: { id: req.params.id } })
}

// Helper functions for enhanced roadmap features
function generateLearningPath(name: string, type: string): Array<{ title: string; description?: string; estimated_hours?: number }> {
  const techPaths: Record<string, any[]> = {
    'React': [
      { title: 'Learn JavaScript fundamentals', description: 'Master ES6+ features, async/await, and DOM manipulation', estimated_hours: 40 },
      { title: 'Understand React basics', description: 'Components, JSX, props, and state', estimated_hours: 20 },
      { title: 'Learn React Hooks', description: 'useState, useEffect, useContext, and custom hooks', estimated_hours: 15 },
      { title: 'State management', description: 'Context API, Redux, or Zustand', estimated_hours: 25 },
      { title: 'Routing and navigation', description: 'React Router for single-page applications', estimated_hours: 10 },
      { title: 'Build projects', description: 'Create 2-3 real-world applications', estimated_hours: 60 }
    ],
    'TypeScript': [
      { title: 'JavaScript proficiency', description: 'Solid understanding of modern JavaScript', estimated_hours: 20 },
      { title: 'TypeScript basics', description: 'Types, interfaces, and basic syntax', estimated_hours: 15 },
      { title: 'Advanced types', description: 'Generics, utility types, and conditional types', estimated_hours: 20 },
      { title: 'TypeScript with frameworks', description: 'Integration with React, Node.js, or other frameworks', estimated_hours: 15 },
      { title: 'Tooling and configuration', description: 'tsconfig.json, ESLint, and build tools', estimated_hours: 10 }
    ],
    'Python': [
      { title: 'Python syntax and basics', description: 'Variables, data types, control structures', estimated_hours: 25 },
      { title: 'Object-oriented programming', description: 'Classes, inheritance, and polymorphism', estimated_hours: 20 },
      { title: 'Standard library', description: 'Common modules and built-in functions', estimated_hours: 15 },
      { title: 'Package management', description: 'pip, virtual environments, and requirements.txt', estimated_hours: 10 },
      { title: 'Web frameworks', description: 'Django, Flask, or FastAPI', estimated_hours: 40 },
      { title: 'Testing and debugging', description: 'pytest, unittest, and debugging techniques', estimated_hours: 15 }
    ]
  }

  return techPaths[name] || [
    { title: `Learn ${name} fundamentals`, description: 'Master the core concepts and syntax', estimated_hours: 30 },
    { title: 'Practice with projects', description: 'Build hands-on experience', estimated_hours: 40 },
    { title: 'Advanced concepts', description: 'Dive deeper into advanced features', estimated_hours: 25 },
    { title: 'Best practices', description: 'Learn industry standards and patterns', estimated_hours: 15 }
  ]
}

function estimateTimeToLearn(name: string, type: string): string {
  const timeEstimates: Record<string, string> = {
    'React': '2-4 months',
    'TypeScript': '1-2 months',
    'Python': '3-6 months',
    'JavaScript': '2-4 months',
    'Node.js': '1-3 months',
    'AWS': '3-6 months',
    'Docker': '2-4 weeks',
    'Kubernetes': '3-6 months',
    'Go': '2-4 months',
    'Rust': '4-8 months'
  }

  return timeEstimates[name] || (type === 'technology' ? '2-4 months' : '1-3 months')
}

function generateMilestones(name: string | undefined, type: string): Array<{ title: string; date: string; completed: boolean }> {
  const now = new Date()
  const milestones: Array<{ title: string; date: string; completed: boolean }> = []
  const safeName = name || 'item'

  if (type === 'technology') {
    milestones.push(
      { title: `Complete ${safeName} basics`, date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', completed: false },
      { title: `Build first ${safeName} project`, date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', completed: false },
      { title: `Master advanced ${safeName} concepts`, date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', completed: false }
    )
  } else if (type === 'project') {
    milestones.push(
      { title: 'Project planning and setup', date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', completed: false },
      { title: 'Core functionality complete', date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', completed: false },
      { title: 'Testing and deployment', date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '', completed: false }
    )
  }

  return milestones
}


export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    // TODO: Implement feedback submission
    res.json({
      success: true,
      data: {
        message: `Feedback for recommendation ${id} endpoint - to be implemented`
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    })
  }
}
