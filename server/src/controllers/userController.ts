import { Response } from 'express'
import { AuthenticatedRequest } from '@/middleware/authMiddleware'
import { createGitHubService } from '@/services/githubService'
import { cacheService } from '@/services/cacheService'
import logger from '@/utils/logger'
import { readUserData, writeUserData } from '@/services/fileStore'

// Types for user settings persistence
interface UserPreferences {
  auto_refresh?: boolean
  include_private?: boolean
  ai_recommendations?: boolean
  notifications?: {
    email_enabled?: boolean
    weekly_digest?: boolean
  }
  privacy?: {
    show_email?: boolean
  }
}

interface UserOverrides {
  name?: string
  email?: string
  bio?: string
}

interface UserSettings {
  overrides?: UserOverrides
  preferences?: UserPreferences
}


export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!
    const cacheKey = `user-profile:${login}`

    // Try cache first
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({
        success: true,
        data: cached
      })
    }

    // Use authenticated GitHub service for the logged-in user
    const githubService = createGitHubService(req.user?.access_token)
    const userProfile = await githubService.getUser()

    // Cache for 15 minutes
    await cacheService.set(cacheKey, userProfile, { ttl: 900 })

    return res.json({
      success: true,
      data: userProfile
    })
  } catch (error) {
    logger.error('Error getting user profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    })
  }
}

export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    // Only allow specific fields to be overridden by the user
    const { name, email, bio } = req.body || {}

    const key = `user-settings:${login}`
    const existing = (await cacheService.get<any>(key)) || {}

    const updated = {
      ...existing,
      overrides: {
        ...(existing.overrides || {}),
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(bio !== undefined ? { bio } : {}),
      }
    }

    await cacheService.set(key, updated, { ttl: 30 * 24 * 60 * 60 })

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    })
  }
}

export const getUserSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login, access_token } = req.user!
    const key = `user-settings:${login}`

    let github: any = null
    try {
      github = await createGitHubService(access_token).getUser()
    } catch {}

    // Prefer durable file-based settings; fall back to cache/generate defaults
    const defaultPrefs: UserSettings = {
      overrides: {},
      preferences: {
        auto_refresh: true,
        include_private: false,
        ai_recommendations: true,
        notifications: { email_enabled: true, weekly_digest: true },
        privacy: { show_email: false }
      }
    }
    const stored: UserSettings = await readUserData<UserSettings>('settings', login, defaultPrefs)

    const mergedProfile = {
      name: stored.overrides?.name ?? github?.name ?? '',
      email: stored.overrides?.email ?? github?.email ?? '',
      bio: stored.overrides?.bio ?? github?.bio ?? ''
    }

    res.json({ success: true, data: { profile: mergedProfile, github_profile: github, overrides: stored.overrides || {}, preferences: stored.preferences || {} } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get user settings' })
  }
}

export const updateUserSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!
    const key = `user-settings:${login}`

    const allowed = {
      overrides: {
        name: req.body?.overrides?.name,
        email: req.body?.overrides?.email,
        bio: req.body?.overrides?.bio,
      },
      preferences: {
        auto_refresh: req.body?.preferences?.auto_refresh,
        include_private: req.body?.preferences?.include_private,
        ai_recommendations: req.body?.preferences?.ai_recommendations,
        notifications: {
          email_enabled: req.body?.preferences?.notifications?.email_enabled,
          weekly_digest: req.body?.preferences?.notifications?.weekly_digest,
        },
        privacy: {
          show_email: req.body?.preferences?.privacy?.show_email,
        }
      }
    }

    await writeUserData('settings', login, allowed)
    // keep cache warm if available
    await cacheService.set(key, allowed, { ttl: 24 * 3600 })

    res.json({ success: true, data: allowed })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user settings' })
  }
}

    // Clean undefined values

export const getUserRepositories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!
    const { page = 1, per_page = 30, sort = 'updated', type = 'owner' } = req.query

    const cacheKey = `user-repos:${login}:${page}:${per_page}:${sort}:${type}`

    // Try cache first
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({
        success: true,
        data: cached
      })
    }

    // Use authenticated endpoint to include private and collaborative repositories
    const githubService = createGitHubService(req.user?.access_token)

    let repositories: any[] = []
    try {
      // Prefer authenticated viewer repos for the current user
      repositories = await githubService.getAuthenticatedUserRepositories({
        page: Number(page),
        per_page: Number(per_page),
        sort: sort as any,
        direction: 'desc',
      })
    } catch (e) {
      // Fallback to public repos by username if authenticated call fails
      repositories = await githubService.getUserRepositories(login, {
        page: Number(page),
        per_page: Number(per_page),
        sort: sort as any,
        type: (type as any) || 'owner'
      })
    }

    // Cache for 10 minutes
    await cacheService.set(cacheKey, repositories, { ttl: 600 })

    return res.json({
      success: true,
      data: repositories
    })
  } catch (error) {
    logger.error('Error getting user repositories:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user repositories'
    })
  }
}

export const getRepository = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { login } = req.user!

    const cacheKey = `repository:${login}:${id}`

    // Try cache first
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({
        success: true,
        data: cached
      })
    }

    const githubService = createGitHubService()
    const repository = await githubService.getRepository(login, String(id))

    // Cache for 15 minutes
    await cacheService.set(cacheKey, repository, { ttl: 900 })

    return res.json({
      success: true,
      data: repository
    })
  } catch (error) {
    logger.error('Error getting repository:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get repository'
    })
  }
}

export const getUserStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implement user statistics calculation
    res.json({
      success: true,
      data: {
        message: 'User stats endpoint - to be implemented'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats'
    })
  }
}

export const getContributions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login, access_token } = req.user!
    const githubService = createGitHubService(access_token)

    // Get year from query parameter, default to current year
    const requestedYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()
    const year = Math.max(2008, Math.min(requestedYear, new Date().getFullYear())) // GitHub was founded in 2008

    const graph = await githubService.getUserContributionsCalendar(login, year)
    const weeks = graph?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || []

    const series: { date: string; count: number }[] = []
    for (const w of weeks) {
      for (const d of (w.contributionDays || [])) {
        series.push({ date: d.date, count: d.contributionCount })
      }
    }

    res.json({ success: true, data: { year, daily: series } })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get contributions'
    })
  }
}
