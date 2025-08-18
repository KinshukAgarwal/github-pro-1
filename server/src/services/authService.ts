// Load environment variables FIRST
import '@/config/env'

import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { GitHubService } from './githubService'
import { cacheService } from './cacheService'
import logger from '@/utils/logger'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface UserSession {
  userId: string
  login: string
  accessToken: string
  refreshToken: string
  createdAt: string
  lastActivity: string
  ipAddress: string
  userAgent: string
}

export interface GitHubOAuthResponse {
  access_token: string
  token_type: string
  scope: string
}

export class AuthService {
  private jwtSecret: string
  private jwtRefreshSecret: string
  private githubClientId: string
  private githubClientSecret: string

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!
    this.githubClientId = process.env.GITHUB_CLIENT_ID!
    this.githubClientSecret = process.env.GITHUB_CLIENT_SECRET!

    if (!this.jwtSecret || !this.jwtRefreshSecret || !this.githubClientId || !this.githubClientSecret) {
      throw new Error('Missing required authentication environment variables')
    }
  }

  /**
   * Generate OAuth URL for GitHub authentication
   */
  generateOAuthURL(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.githubClientId,
      redirect_uri: process.env.GITHUB_CALLBACK_URL || `${process.env.SERVER_URL}/api/auth/github/callback`,
      scope: 'read:user user:email repo',
      state: state || crypto.randomBytes(16).toString('hex')
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string, state?: string): Promise<GitHubOAuthResponse> {
    try {
      logger.info('Attempting to exchange code for token with GitHub')

      const requestBody = {
        client_id: this.githubClientId,
        client_secret: this.githubClientSecret,
        code,
        state
      }

      logger.info('Token exchange request', {
        client_id: this.githubClientId,
        code: code.substring(0, 10) + '...',
        has_secret: !!this.githubClientSecret
      })

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      logger.info('GitHub token response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('GitHub OAuth response error:', { status: response.status, body: errorText })
        throw new Error(`GitHub OAuth error: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as any
      logger.info('GitHub token response data:', {
        has_access_token: !!data.access_token,
        token_type: data.token_type,
        scope: data.scope,
        error: data.error
      })

      if (data.error) {
        logger.error('GitHub OAuth data error:', data)
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
      }

      if (!data.access_token) {
        logger.error('No access token in response:', data)
        throw new Error('No access token received from GitHub')
      }

      return data as GitHubOAuthResponse
    } catch (error) {
      logger.error('Error exchanging OAuth code:', error)
      throw error
    }
  }

  /**
   * Create JWT tokens for authenticated user
   */
  async createTokens(githubAccessToken: string, ipAddress: string, userAgent: string): Promise<AuthTokens> {
    try {
      // Get user info from GitHub
      const githubService = new GitHubService(githubAccessToken)
      const user = await githubService.getUser()

      if (!user) {
        throw new Error('Failed to get user information from GitHub')
      }

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user.id.toString(),
          login: user.login,
          access_token: githubAccessToken
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      )

      const refreshToken = jwt.sign(
        {
          userId: user.id.toString(),
          login: user.login,
          type: 'refresh'
        },
        this.jwtRefreshSecret,
        { expiresIn: '7d' }
      )

      // Store session
      const session: UserSession = {
        userId: user.id.toString(),
        login: user.login,
        accessToken: githubAccessToken,
        refreshToken,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress,
        userAgent
      }

      await this.storeSession(user.id.toString(), session)

      return {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour
      }
    } catch (error) {
      logger.error('Error creating tokens:', error)
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string, ipAddress: string, userAgent: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token')
      }

      // Get stored session
      const session = await this.getSession(decoded.userId)
      if (!session || session.refreshToken !== refreshToken) {
        throw new Error('Invalid or expired refresh token')
      }

      // Verify GitHub access token is still valid
      const githubService = new GitHubService(session.accessToken)
      const user = await githubService.getUser()

      if (!user || user.login !== decoded.login) {
        throw new Error('GitHub access token is invalid')
      }

      // Generate new tokens
      const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          login: decoded.login,
          access_token: session.accessToken
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      )

      const newRefreshToken = jwt.sign(
        {
          userId: decoded.userId,
          login: decoded.login,
          type: 'refresh'
        },
        this.jwtRefreshSecret,
        { expiresIn: '7d' }
      )

      // Update session
      session.refreshToken = newRefreshToken
      session.lastActivity = new Date().toISOString()
      session.ipAddress = ipAddress
      session.userAgent = userAgent

      await this.storeSession(decoded.userId, session)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600
      }
    } catch (error) {
      logger.error('Error refreshing tokens:', error)
      throw error
    }
  }

  /**
   * Validate access token and return user info
   */
  async validateToken(accessToken: string): Promise<any> {
    try {
      const decoded = jwt.verify(accessToken, this.jwtSecret) as any

      // Get session to verify it's still valid
      const session = await this.getSession(decoded.userId)
      if (!session) {
        throw new Error('Session not found')
      }

      // Update last activity
      session.lastActivity = new Date().toISOString()
      await this.storeSession(decoded.userId, session)

      return {
        userId: decoded.userId,
        login: decoded.login,
        accessToken: decoded.access_token
      }
    } catch (error) {
      logger.error('Error validating token:', error)
      throw error
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string): Promise<void> {
    try {
      await this.removeSession(userId)
      logger.info(`User ${userId} logged out`)
    } catch (error) {
      logger.error('Error during logout:', error)
      throw error
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      await this.removeAllSessions(userId)
      logger.info(`User ${userId} logged out from all devices`)
    } catch (error) {
      logger.error('Error during logout all:', error)
      throw error
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const sessions = await cacheService.get<UserSession[]>(`sessions:${userId}`)
      return sessions || []
    } catch (error) {
      logger.error('Error getting user sessions:', error)
      return []
    }
  }

  /**
   * Store user session
   */
  private async storeSession(userId: string, session: UserSession): Promise<void> {
    const key = `session:${userId}`
    await cacheService.set(key, session, { ttl: 7 * 24 * 60 * 60 }) // 7 days
  }

  /**
   * Get user session
   */
  private async getSession(userId: string): Promise<UserSession | null> {
    const key = `session:${userId}`
    return await cacheService.get<UserSession>(key)
  }

  /**
   * Remove user session
   */
  private async removeSession(userId: string): Promise<void> {
    const key = `session:${userId}`
    await cacheService.del(key)
  }

  /**
   * Remove all user sessions
   */
  private async removeAllSessions(userId: string): Promise<void> {
    const pattern = `session:${userId}*`
    await cacheService.flush(pattern)
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const pattern = 'session:*'
      // Best-effort: if cache supports scanning, flush by pattern (no-op if not supported)
      await cacheService.flush(pattern)
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error)
    }
  }
}

export const authService = new AuthService()
