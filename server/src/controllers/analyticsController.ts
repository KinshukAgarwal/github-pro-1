import { Response } from 'express'
import { AuthenticatedRequest } from '@/middleware/authMiddleware'
import { createGitHubService } from '@/services/githubService'
import { createAnalyticsService } from '@/services/analyticsService'
import logger from '@/utils/logger'

export const getProfileScore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    const githubService = createGitHubService(req.user?.access_token)
    const analyticsService = createAnalyticsService(githubService)

    const profileScore = await analyticsService.calculateProfileScore(login)

    res.json({
      success: true,
      data: profileScore
    })
  } catch (error) {
    logger.error('Error getting profile score:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get profile score'
    })
  }
}

export const getRepositoryAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    const githubService = createGitHubService(req.user?.access_token)
    const analyticsService = createAnalyticsService(githubService)

    const repositoryAnalysis = await analyticsService.analyzeRepositories(login)

    res.json({
      success: true,
      data: repositoryAnalysis
    })
  } catch (error) {
    logger.error('Error getting repository analysis:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get repository analysis'
    })
  }
}

export const getContributionPatterns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    // Get year from query parameter, default to current year
    const requestedYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()
    const year = Math.max(2008, Math.min(requestedYear, new Date().getFullYear())) // GitHub was founded in 2008

    const githubService = createGitHubService(req.user?.access_token)

    // Use GraphQL contributionsCollection for exact counts
    const graph = await githubService.getUserContributionsCalendar(login, year)
    const weeks = graph?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || []

    const series: { date: string; count: number }[] = []
    for (const w of weeks) {
      for (const d of (w.contributionDays || [])) {
        series.push({ date: d.date, count: d.contributionCount })
      }
    }

    // Fill to full year in case of missing leading/trailing days
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31)
    const map = new Map(series.map(s => [s.date, s.count]))
    const filled: { date: string; count: number }[] = []
    const cursor = new Date(startOfYear)
    while (cursor <= endOfYear) {
      const dsParts = cursor.toISOString().split('T')
      const ds: string = (dsParts[0] ?? '')
      filled.push({ date: ds, count: map.get(ds) ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    const total = filled.reduce((s, d) => s + d.count, 0)
    const { longestStreak, currentStreak } = calcStreaks(filled)
    const averagePerDay = Math.round((total / filled.length) * 10) / 10

    res.json({
      success: true,
      data: {
        year,
        total,
        longest_streak: longestStreak,
        current_streak: currentStreak,
        average_per_day: averagePerDay,
        daily: filled
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get contribution patterns'
    })
  }
}

function calcStreaks(series: { date: string; count: number }[]) {
  let longestStreak = 0
  let currentStreak = 0
  let tempStreak = 0

  for (const d of series) {
    if (d.count > 0) {
      tempStreak += 1
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  // Calculate current streak from end
  for (let i = series.length - 1; i >= 0; i--) {
    const point = series[i]
    if (!point) break
    if (point.count > 0) currentStreak += 1
    else break
  }

  return { longestStreak, currentStreak }
}

export const getLanguageDistribution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!

    const githubService = createGitHubService(req.user?.access_token)
    const analyticsService = createAnalyticsService(githubService)

    // Delegate to service which aggregates by bytes and caches
    const distribution = await analyticsService.getLanguageDistribution(login)

    res.json({
      success: true,
      data: distribution
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get language distribution'
    })
  }
}


export const getTechnologyTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { login } = req.user!
    const githubService = createGitHubService(req.user?.access_token)
    const analyticsService = createAnalyticsService(githubService)

    const trends = await analyticsService.getTechnologyTrends(login)

    res.json({
      success: true,
      data: trends,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get technology trends',
    })
  }
}

export const refreshAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implement analytics refresh
    res.json({
      success: true,
      data: {
        message: 'Analytics refresh endpoint - to be implemented'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh analytics'
    })
  }
}

export const exportAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // TODO: Implement analytics export
    res.json({
      success: true,
      data: {
        message: 'Analytics export endpoint - to be implemented'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics'
    })
  }
}


export const getMarketTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tech, months } = req.query as any
    if (!tech) return res.status(400).json({ success: false, error: 'Query param "tech" is required' })

    const analyticsService = createAnalyticsService(createGitHubService())
    const data = await analyticsService.getLanguageMarketTrends(tech as string, months ? parseInt(months as string) : 6)

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get market trends' })
  }
}
