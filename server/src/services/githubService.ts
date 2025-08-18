// Load environment variables FIRST
import '@/config/env'

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import logger from '@/utils/logger'

export interface GitHubApiConfig {
  baseURL: string
  version: string
  timeout: number
  maxRetries: number
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  used: number
}

export class GitHubService {
  private client: AxiosInstance
  private config: GitHubApiConfig
  private graphqlClient: AxiosInstance

  private rateLimitInfo: RateLimitInfo | null = null

  constructor(accessToken?: string) {
    this.config = {
      baseURL: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
      version: process.env.GITHUB_API_VERSION || '2022-11-28',
      timeout: 30000,
      maxRetries: 3
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': this.config.version,
        'User-Agent': 'GitHub-Analytics-Platform/1.0',
        ...(accessToken && { 'Authorization': `token ${accessToken}` })
      }
    })

    // GraphQL client for endpoints that require it
    this.graphqlClient = axios.create({
      baseURL: 'https://api.github.com/graphql',
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': this.config.version,
        'User-Agent': 'GitHub-Analytics-Platform/1.0',
        ...(accessToken && { 'Authorization': `bearer ${accessToken}` })
      }
    })


    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`GitHub API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('GitHub API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor for rate limiting and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit info
        this.updateRateLimitInfo(response.headers)
        logger.info(`GitHub API Response: ${response.status} ${response.config.url}`)
        return response
      },
      async (error) => {
        if (error.response) {
          const { status, headers } = error.response
          this.updateRateLimitInfo(headers)

          // Handle rate limiting
          if (status === 403 && headers['x-ratelimit-remaining'] === '0') {
            const resetTime = parseInt(headers['x-ratelimit-reset']) * 1000
            const waitTime = resetTime - Date.now()

            logger.warn(`Rate limit exceeded. Reset at: ${new Date(resetTime)}`)

            if (waitTime > 0 && waitTime < 3600000) { // Wait max 1 hour
              logger.info(`Waiting ${waitTime}ms for rate limit reset`)
              await this.sleep(waitTime)
              return this.client.request(error.config)
            }
          }

          // Handle other errors
          logger.error(`GitHub API Error: ${status} ${error.response.data?.message || error.message}`)
        }

        return Promise.reject(error)
      }
    )
  }

  private updateRateLimitInfo(headers: any) {
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo = {
        limit: parseInt(headers['x-ratelimit-limit']),
        remaining: parseInt(headers['x-ratelimit-remaining']),
        reset: parseInt(headers['x-ratelimit-reset']),
        used: parseInt(headers['x-ratelimit-used'])
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  // User methods
  async getUser(username?: string): Promise<any> {
    const url = username ? `/users/${username}` : '/user'
    const response = await this.client.get(url)
    return response.data
  }

  async getUserRepositories(username: string, options: {
    type?: 'all' | 'owner' | 'member'
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  } = {}): Promise<any[]> {
    const params = {
      type: 'owner',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      ...options
    }

    const response = await this.client.get(`/users/${username}/repos`, { params })
    return response.data
  }

  async getRepository(owner: string, repo: string): Promise<any> {
    const response = await this.client.get(`/repos/${owner}/${repo}`)
    return response.data
  }
  // Authenticated user repositories (includes private/collaborator repos)
  async getAuthenticatedUserRepositories(options: {
    type?: 'all' | 'owner' | 'member'
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  } = {}): Promise<any[]> {
    const params = {
      type: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      ...options
    }

    const response = await this.client.get('/user/repos', { params })
    return response.data
  }


  async getRepositoryLanguages(owner: string, repo: string): Promise<any> {
    const response = await this.client.get(`/repos/${owner}/${repo}/languages`)
    return response.data
  }

  async getRepositoryContributors(owner: string, repo: string): Promise<any[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/contributors`)
    return response.data
  }

  async getRepositoryCommits(owner: string, repo: string, options: {
    since?: string
    until?: string
    per_page?: number
    page?: number
  } = {}): Promise<any[]> {
    const params = {
      per_page: 100,
      ...options
    }

    const response = await this.client.get(`/repos/${owner}/${repo}/commits`, { params })
    return response.data
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<any> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/readme`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null // No README found
      }
      throw error
    }
  }

  async getUserEvents(username: string, options: {
    per_page?: number
    page?: number
  } = {}): Promise<any[]> {
    const params = {
      per_page: 100,
      ...options
    }

    const response = await this.client.get(`/users/${username}/events`, { params })
    return response.data
  }

  async getUserFollowers(username: string): Promise<any[]> {
    const response = await this.client.get(`/users/${username}/followers`)
    return response.data
  }

  async getUserFollowing(username: string): Promise<any[]> {
    const response = await this.client.get(`/users/${username}/following`)
    return response.data
  }

  async getUserStarredRepos(username: string, options: {
    sort?: 'created' | 'updated'
    direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  } = {}): Promise<any[]> {
    const params = {
      sort: 'created',
      direction: 'desc',
      per_page: 100,
      ...options
    }

    const response = await this.client.get(`/users/${username}/starred`, { params })
    return response.data
  }

  // Search methods
  async searchRepositories(query: string, options: {
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated'
    order?: 'desc' | 'asc'
    per_page?: number
    page?: number
  } = {}): Promise<any> {
    const params = {
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: 30,
      ...options
    }

    const response = await this.client.get('/search/repositories', { params })
    return response.data
  }

  async searchUsers(query: string, options: {
    sort?: 'followers' | 'repositories' | 'joined'
    order?: 'desc' | 'asc'
    per_page?: number
    page?: number
  } = {}): Promise<any> {
    const params = {
      q: query,
      sort: 'followers',
      order: 'desc',
      per_page: 30,
      ...options
    }

    const response = await this.client.get('/search/users', { params })
    return response.data
  }

  // Content methods
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<any> {
    const data = {
      message,
      content: Buffer.from(content).toString('base64'),
      ...(sha && { sha })
    }

    const response = await this.client.put(`/repos/${owner}/${repo}/contents/${path}`, data)
    return response.data
  }

  // GraphQL: contributions calendar for a given user and year
  async getUserContributionsCalendar(username: string, year: number): Promise<any> {
    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays { date contributionCount }
              }
            }
          }
        }
      }
    `
    const from = new Date(year, 0, 1).toISOString()
    const to = new Date(year, 11, 31).toISOString()
    const resp = await this.graphqlClient.post('', { query, variables: { login: username, from, to } })
    return resp.data
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<any> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  // Validate repository access and permissions
  async validateRepositoryAccess(owner: string, repo: string): Promise<{
    hasAccess: boolean
    hasWriteAccess: boolean
    repository?: any
    error?: string
  }> {
    try {
      const repository = await this.getRepository(owner, repo)

      if (!repository) {
        return {
          hasAccess: false,
          hasWriteAccess: false,
          error: 'Repository not found or you do not have access to it'
        }
      }

      const hasWriteAccess = repository.permissions?.push || repository.permissions?.admin || false

      return {
        hasAccess: true,
        hasWriteAccess,
        repository,
        error: hasWriteAccess ? undefined : 'You do not have write access to this repository'
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          hasAccess: false,
          hasWriteAccess: false,
          error: 'Repository not found or you do not have access to it'
        }
      }
      if (error.response?.status === 403) {
        return {
          hasAccess: false,
          hasWriteAccess: false,
          error: 'You do not have sufficient permissions to access this repository'
        }
      }
      throw error
    }
  }
}

// Factory function to create GitHub service with token
export const createGitHubService = (accessToken?: string): GitHubService => {
  return new GitHubService(accessToken)
}

// Default instance without authentication (for public data)
export const githubService = new GitHubService()
