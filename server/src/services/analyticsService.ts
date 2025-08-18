// Load environment variables FIRST
import '@/config/env'

import { GitHubService } from './githubService'
import { cacheService } from './cacheService'
import logger from '@/utils/logger'

export interface ProfileScoreBreakdown {
  overall_score: number
  repository_quality: number
  contribution_consistency: number
  code_quality: number
  community_engagement: number
  documentation_completeness: number
  breakdown: {
    repository_quality: {
      score: number
      factors: {
        avg_stars_per_repo: number
        repo_diversity: number
        recent_activity: number
        code_quality_indicators: number
      }
    }
    contribution_consistency: {
      score: number
      factors: {
        commit_frequency: number
        contribution_streak: number
        activity_distribution: number
      }
    }
    community_engagement: {
      score: number
      factors: {
        followers_ratio: number
        collaboration_score: number
        issue_participation: number
      }
    }
    documentation_completeness: {
      score: number
      factors: {
        readme_coverage: number
        documentation_quality: number
        wiki_usage: number
      }
    }
  }
}

export interface RepositoryAnalysis {
  total_repos: number
  total_stars: number
  total_forks: number
  total_size: number
  languages: { [language: string]: number }
  topics: string[]
  most_starred_repo: any
  most_recent_repo: any
  readme_coverage: number
  avg_repo_quality: number
}

export interface ContributionPattern {
  total_contributions: number
  daily_average: number
  weekly_pattern: number[]
  monthly_pattern: number[]
  longest_streak: number
  current_streak: number
  most_active_day: string
  contribution_distribution: {
    commits: number
    issues: number
    pull_requests: number
    reviews: number
  }
}

export class AnalyticsService {
  private githubService: GitHubService

  constructor(githubService: GitHubService) {
    this.githubService = githubService
  }

  // Backwards-compatibility shim for callers expecting getProfileScore
  async getProfileScore(username: string) {
    return this.calculateProfileScore(username)
  }

  async calculateProfileScore(username: string): Promise<ProfileScoreBreakdown> {
    const cacheKey = `profile-score:${username}`

    // Try to get from cache first
    const cached = await cacheService.get<ProfileScoreBreakdown>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      logger.info(`Calculating profile score for ${username}`)

      // Fetch user data
      const user = await this.githubService.getUser(username)
      const repositories = await this.githubService.getUserRepositories(username, {
        type: 'owner',
        sort: 'updated',
        per_page: 100
      })

      // Calculate individual scores
      const repositoryQuality = await this.calculateRepositoryQuality(repositories)
      const contributionConsistency = await this.calculateContributionConsistency(username)
      const communityEngagement = await this.calculateCommunityEngagement(user, repositories)
      const documentationCompleteness = await this.calculateDocumentationCompleteness(repositories)

      // Calculate overall score (weighted average)
      const weights = {
        repository_quality: 0.3,
        contribution_consistency: 0.25,
        community_engagement: 0.25,
        documentation_completeness: 0.2
      }

      const overallScore = Math.round(
        repositoryQuality.score * weights.repository_quality +
        contributionConsistency.score * weights.contribution_consistency +
        communityEngagement.score * weights.community_engagement +
        documentationCompleteness.score * weights.documentation_completeness
      )

      const result: ProfileScoreBreakdown = {
        overall_score: overallScore,
        repository_quality: repositoryQuality.score,
        contribution_consistency: contributionConsistency.score,
        code_quality: Math.round((repositoryQuality.score + contributionConsistency.score) / 2),
        community_engagement: communityEngagement.score,
        documentation_completeness: documentationCompleteness.score,
        breakdown: {
          repository_quality: repositoryQuality,
          contribution_consistency: contributionConsistency,
          community_engagement: communityEngagement,
          documentation_completeness: documentationCompleteness
        }
      }

      // Cache the result for 1 hour
      await cacheService.set(cacheKey, result, { ttl: 3600 })

      return result
    } catch (error) {
      logger.error(`Error calculating profile score for ${username}:`, error)
      throw error
    }
  }

  private async calculateRepositoryQuality(repositories: any[]): Promise<any> {
    if (repositories.length === 0) {
      return {
        score: 0,
        factors: {
          avg_stars_per_repo: 0,
          repo_diversity: 0,
          recent_activity: 0,
          code_quality_indicators: 0
        }
      }
    }

    // Calculate average stars per repo
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    const avgStarsPerRepo = totalStars / repositories.length

    // Calculate language diversity
    const languages = new Set(repositories.map(repo => repo.language).filter(Boolean))
    const repoDiversity = Math.min(languages.size * 10, 100) // Max 100 points for 10+ languages

    // Calculate recent activity (repos updated in last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentRepos = repositories.filter(repo => new Date(repo.updated_at) > sixMonthsAgo)
    const recentActivity = Math.min((recentRepos.length / repositories.length) * 100, 100)

    // Calculate code quality indicators (has description, topics, etc.)
    const qualityRepos = repositories.filter(repo =>
      repo.description &&
      repo.topics &&
      repo.topics.length > 0 &&
      !repo.fork
    )
    const codeQualityIndicators = Math.min((qualityRepos.length / repositories.length) * 100, 100)

    // Weighted score calculation
    const score = Math.round(
      Math.min(avgStarsPerRepo * 2, 25) * 0.3 + // Max 25 points for stars
      repoDiversity * 0.25 +
      recentActivity * 0.25 +
      codeQualityIndicators * 0.2
    )

    return {
      score,
      factors: {
        avg_stars_per_repo: Math.round(avgStarsPerRepo * 10) / 10,
        repo_diversity: Math.round(repoDiversity),
        recent_activity: Math.round(recentActivity),
        code_quality_indicators: Math.round(codeQualityIndicators)
      }
    }
  }

  private async calculateContributionConsistency(username: string): Promise<any> {
    try {
      // Get user events for contribution analysis
      const events = await this.githubService.getUserEvents(username, { per_page: 100 })

      if (events.length === 0) {
        return {
          score: 0,
          factors: {
            commit_frequency: 0,
            contribution_streak: 0,
            activity_distribution: 0
          }
        }
      }

      // Analyze commit frequency (events per day over last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentEvents = events.filter(event => new Date(event.created_at) > thirtyDaysAgo)
      const commitFrequency = Math.min((recentEvents.length / 30) * 20, 100) // Max 100 for 5+ events per day

      // Calculate contribution streak (simplified)
      const contributionStreak = Math.min(recentEvents.length * 2, 100)

      // Activity distribution (variety of event types)
      const eventTypes = new Set(events.map(event => event.type))
      const activityDistribution = Math.min(eventTypes.size * 15, 100) // Max 100 for 7+ event types

      const score = Math.round(
        commitFrequency * 0.4 +
        contributionStreak * 0.3 +
        activityDistribution * 0.3
      )

      return {
        score,
        factors: {
          commit_frequency: Math.round(commitFrequency),
          contribution_streak: Math.round(contributionStreak),
          activity_distribution: Math.round(activityDistribution)
        }
      }
    } catch (error) {
      logger.error(`Error calculating contribution consistency for ${username}:`, error)
      return {
        score: 50, // Default score on error
        factors: {
          commit_frequency: 50,
          contribution_streak: 50,
          activity_distribution: 50
        }
      }
    }
  }

  private async calculateCommunityEngagement(user: any, repositories: any[]): Promise<any> {
    // Calculate followers ratio
    const followersRatio = user.followers > 0 ?
      Math.min((user.followers / Math.max(user.following, 1)) * 20, 100) : 0

    // Calculate collaboration score (forks and watchers)
    const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0)
    const totalWatchers = repositories.reduce((sum, repo) => sum + repo.watchers_count, 0)
    const collaborationScore = Math.min((totalForks + totalWatchers) / 10, 100)

    // Issue participation (simplified - based on public repos with issues enabled)
    const reposWithIssues = repositories.filter(repo => repo.has_issues && repo.open_issues_count > 0)
    const issueParticipation = Math.min((reposWithIssues.length / Math.max(repositories.length, 1)) * 100, 100)

    const score = Math.round(
      followersRatio * 0.4 +
      collaborationScore * 0.35 +
      issueParticipation * 0.25
    )

    return {
      score,
      factors: {
        followers_ratio: Math.round(followersRatio),
        collaboration_score: Math.round(collaborationScore),
        issue_participation: Math.round(issueParticipation)
      }
    }
  }

  private async calculateDocumentationCompleteness(repositories: any[]): Promise<any> {
    if (repositories.length === 0) {
      return {
        score: 0,
        factors: {
          readme_coverage: 0,
          documentation_quality: 0,
          wiki_usage: 0
        }
      }
    }

    // Check README coverage (simplified - we'll enhance this later)
    const reposWithDescription = repositories.filter(repo => repo.description && repo.description.length > 10)
    const readmeCoverage = (reposWithDescription.length / repositories.length) * 100

    // Documentation quality (repos with topics and good descriptions)
    const qualityDocs = repositories.filter(repo =>
      repo.description &&
      repo.description.length > 20 &&
      repo.topics &&
      repo.topics.length > 0
    )
    const documentationQuality = (qualityDocs.length / repositories.length) * 100

    // Wiki usage (repos with wikis enabled)
    const reposWithWiki = repositories.filter(repo => repo.has_wiki)
    const wikiUsage = (reposWithWiki.length / repositories.length) * 100

    const score = Math.round(
      readmeCoverage * 0.5 +
      documentationQuality * 0.3 +
      wikiUsage * 0.2
    )

    return {
      score,
      factors: {
        readme_coverage: Math.round(readmeCoverage),
        documentation_quality: Math.round(documentationQuality),
        wiki_usage: Math.round(wikiUsage)
      }
    }
  }

  async analyzeRepositories(username: string): Promise<RepositoryAnalysis> {
    const cacheKey = `repo-analysis:${username}`

    const cached = await cacheService.get<RepositoryAnalysis>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Prefer authenticated viewer repos (covers private and collaborations). Fallback to public by username.
      let repositories: any[]
      try {
        repositories = await (this.githubService as any).getAuthenticatedUserRepositories({
          type: 'all',
          sort: 'updated',
          per_page: 100
        })
      } catch {
        repositories = await this.githubService.getUserRepositories(username, {
          type: 'owner',
          sort: 'updated',
          per_page: 100
        })
      }

      const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)
      const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0)
      const totalSize = repositories.reduce((sum, repo) => sum + repo.size, 0)

      // Language distribution
      const languages: { [key: string]: number } = {}
      repositories.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1
        }
      })

      // Collect all topics
      const allTopics = repositories.flatMap(repo => repo.topics || [])
      const topics = [...new Set(allTopics)]

      // Find most starred and most recent repos
      const mostStarredRepo = repositories.reduce((max, repo) =>
        repo.stargazers_count > max.stargazers_count ? repo : max, repositories[0])

      const mostRecentRepo = repositories.reduce((latest, repo) =>
        new Date(repo.updated_at) > new Date(latest.updated_at) ? repo : latest, repositories[0])

      // Calculate README coverage
      const reposWithDescription = repositories.filter(repo => repo.description)
      const readmeCoverage = repositories.length > 0 ?
        (reposWithDescription.length / repositories.length) * 100 : 0

      const result: RepositoryAnalysis = {
        total_repos: repositories.length,
        total_stars: totalStars,
        total_forks: totalForks,
        total_size: totalSize,
        languages,
        topics,
        most_starred_repo: mostStarredRepo,
        most_recent_repo: mostRecentRepo,
        readme_coverage: Math.round(readmeCoverage),
        avg_repo_quality: repositories.length > 0 ? Math.round(totalStars / repositories.length * 10) / 10 : 0
      }

      // Cache for 30 minutes
      await cacheService.set(cacheKey, result, { ttl: 1800 })

      return result
    } catch (error) {
      logger.error(`Error analyzing repositories for ${username}:`, error)
      throw error
    }
  }

  // NEW: Aggregate language distribution by bytes across repositories
  async getLanguageDistribution(username: string): Promise<Array<{ language: string; percentage: number; bytes: number }>> {
    const cacheKey = `language-distribution:${username}`
    const cached = await cacheService.get<Array<{ language: string; percentage: number; bytes: number }>>(cacheKey)
    if (cached) return cached

    try {
      const repos = await this.githubService.getUserRepositories(username, {
        type: 'owner',
        sort: 'updated',
        per_page: 100,
      })

      // Limit to 30 most recently updated to reduce API calls
      const selected = repos.slice(0, 30)
      const aggregate: Record<string, number> = {}

      for (const repo of selected) {
        try {
          const langs = await this.githubService.getRepositoryLanguages(username, repo.name)
          for (const [lang, bytes] of Object.entries(langs || {})) {
            aggregate[lang] = (aggregate[lang] || 0) + (bytes as number)
          }
        } catch (e) {
          // Ignore individual repo errors to be resilient
          continue
        }
      }

      const totalBytes = Object.values(aggregate).reduce((s, v) => s + v, 0)
      const items = Object.entries(aggregate)
        .sort((a, b) => b[1] - a[1])
        .map(([language, bytes]) => ({
          language,
          bytes,
          percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
        }))

      // Cache 30 minutes
      await cacheService.set(cacheKey, items, { ttl: 1800 })
      return items
    } catch (error) {
      logger.error(`Error computing language distribution for ${username}:`, error)
      return []
    }
  }

  // NEW: Simple technology trends generator based on language distribution
  async getTechnologyTrends(username: string): Promise<Array<{ technology: string; trend: 'rising' | 'stable' | 'declining'; demand_score: number; growth_rate: number; data_points: { month: string; value: number }[] }>> {
    const cacheKey = `technology-trends:${username}`
    const cached = await cacheService.get<any[]>(cacheKey)
    if (cached) return cached

    const languages = await this.getLanguageDistribution(username)
    const top = languages.slice(0, 3)

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const now = new Date()
    const last6: string[] = Array.from({ length: 6 }, (_, i) => months[(now.getMonth() - 5 + i + 12) % 12] as string)

    const trends = top.map((l, idx) => {
      const base = 70 + Math.min(25, Math.round(l.percentage)) // base demand
      const prevPctVal = idx > 0 ? top[idx - 1]?.percentage ?? l.percentage : l.percentage
      const growth = Math.max(-5, Math.min(25, Math.round(l.percentage - prevPctVal)))
      const trend: 'rising' | 'stable' | 'declining' = growth > 5 ? 'rising' : growth < -2 ? 'declining' : 'stable'

      // Build smooth data series
      const start = Math.max(50, Math.min(95, base - Math.floor(growth / 2)))
      const step = growth / 5
      const data_points: Array<{ month: string; value: number }> = last6.map((m, i) => ({ month: m, value: Math.max(40, Math.min(100, Math.round(start + step * i))) }))

      return {
        technology: l.language,
        trend,
        demand_score: Math.max(50, Math.min(100, Math.round(base))),
        growth_rate: Math.round(growth),
        data_points,
      }
    })

    await cacheService.set(cacheKey, trends, { ttl: 1800 })
    return trends
  }

  async getLanguageMarketTrends(tech: string, months: number = 6): Promise<Array<{ month: string; value: number }>> {
    // Cache key per tech+months
    const cacheKey = `market-trends:${tech.toLowerCase()}:${months}`
    const cached = await cacheService.get<Array<{ month: string; value: number }>>(cacheKey)
    if (cached) return cached

    const now = new Date()
    const results: Array<{ month: string; value: number }> = []

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const monthLabel = start.toLocaleDateString('en-US', { month: 'short' })

      const query = `language:${tech} created:${start.toISOString().split('T')[0]}..${end.toISOString().split('T')[0]}`
      try {
        const data = await this.githubService.searchRepositories(query, { per_page: 1 })
        // GitHub returns total_count across all pages
        results.push({ month: monthLabel, value: Math.min(100, Math.round(Math.log10(Math.max(1, data.total_count)) * 20)) })
      } catch (e) {
        results.push({ month: monthLabel, value: 0 })
      }
    }

    await cacheService.set(cacheKey, results, { ttl: 3600 })
    return results
  }

}



export const createAnalyticsService = (githubService: GitHubService): AnalyticsService => {
  return new AnalyticsService(githubService)
}
