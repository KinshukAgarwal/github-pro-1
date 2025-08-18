import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { AuthenticatedRequest } from '@/middleware/authMiddleware'
import { authService } from '@/services/authService'
import { GitHubService } from '@/services/githubService'
import logger from '@/utils/logger'

export const initiateGitHubAuth = async (req: Request, res: Response) => {
  try {
    const { state, redirect_uri } = req.query
    const oauthUrl = authService.generateOAuthURL(state as string)

    if (redirect_uri) {
      // Store redirect URI for after authentication
      // In production, you'd want to validate this URL
      res.cookie('auth_redirect', redirect_uri, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000 // 10 minutes
      })
    }

    res.redirect(oauthUrl)
  } catch (error) {
    logger.error('GitHub auth initiation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initiate GitHub authentication'
    })
  }
}

export const handleGitHubCallback = async (req: Request, res: Response) => {
  try {
    logger.info('GitHub callback received', {
      query: req.query,
      cookies: Object.keys(req.cookies || {})
    })

    const { code, state, error } = req.query

    // Check for GitHub OAuth errors
    if (error) {
      logger.error('GitHub OAuth error:', { error, error_description: req.query.error_description })
      const errorUrl = `${process.env.CLIENT_URL}/login?error=github_oauth_error&details=${error}`
      return res.redirect(errorUrl)
    }

    if (!code) {
      logger.error('No authorization code received')
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      })
    }

    // Exchange code for access token
    logger.info('Exchanging code for token', { code: code.toString().substring(0, 10) + '...' })
    const githubTokenResponse = await authService.exchangeCodeForToken(code as string, state as string)
    logger.info('Token exchange successful')

    // Create JWT tokens and session
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    const tokens = await authService.createTokens(
      githubTokenResponse.access_token,
      ipAddress,
      userAgent
    )

    // Get user info for response
    const githubService = new GitHubService(githubTokenResponse.access_token)
    const user = await githubService.getUser()

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    }

    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn * 1000 // Convert to milliseconds
    })

    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Check for redirect URL
    const redirectUrl = req.cookies?.auth_redirect || '/login'
    res.clearCookie('auth_redirect')

    // Build final redirect URL and set auth=success robustly
    const clientBase = process.env.CLIENT_URL || 'http://127.0.0.1:3000'
    const finalUrl = new URL(redirectUrl, clientBase)
    finalUrl.searchParams.set('auth', 'success')

    // Redirect to client with success
    res.redirect(finalUrl.toString())

  } catch (error) {
    logger.error('GitHub callback error:', error)
    const errorUrl = `${process.env.CLIENT_URL}/login?error=auth_failed`
    res.redirect(errorUrl)
  }
}

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
    }

    // Get fresh user data from GitHub
    const githubService = new GitHubService(req.user.access_token)
    const user = await githubService.getUser()

    return res.json({
      success: true,
      data: {
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
        }
      }
    })
  } catch (error) {
    logger.error('Get current user error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get current user'
    })
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refresh_token

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      })
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    const tokens = await authService.refreshTokens(refreshToken, ipAddress, userAgent)

    // Set new cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    }

    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn * 1000
    })

    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({
      success: true,
      data: {
        access_token: tokens.accessToken,
        expires_in: tokens.expiresIn
      }
    })
  } catch (error) {
    logger.error('Token refresh error:', error)
    res.status(401).json({
      success: false,
      error: 'Failed to refresh token'
    })
  }
}

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user) {
      await authService.logout(req.user.id)
    }

    // Clear cookies
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    })
  }
}

// Return session details using httpOnly cookies so the client can store tokens in localStorage
export const getSession = async (req: Request, res: Response) => {
  try {
    const cookieAccess = req.cookies?.access_token

    if (!cookieAccess) {
      return res.status(200).json({ success: false, error: 'No session' })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({ success: false, error: 'Server configuration error' })
    }

    // Verify our app JWT stored in cookie
    const decoded = jwt.verify(cookieAccess, jwtSecret) as { userId: string; login: string; access_token: string }

    // Validate GitHub token and fetch user
    const githubService = new GitHubService(decoded.access_token)
    const user = await githubService.getUser()

    if (!user || user.login !== decoded.login) {
      return res.status(401).json({ success: false, error: 'Invalid session' })
    }

    // Return token and minimal user info for client to persist
    return res.json({
      success: true,
      data: {
        token: cookieAccess,
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url
        }
      }
    })
  } catch (error) {
    logger.error('Get session error:', error)
    return res.status(401).json({ success: false, error: 'Failed to get session' })
  }
}

// Debug endpoint to check OAuth configuration
export const debugOAuth = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      config: {
        github_client_id: process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING',
        github_client_secret: process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING',
        github_callback_url: process.env.GITHUB_CALLBACK_URL,
        server_url: process.env.SERVER_URL,
        client_url: process.env.CLIENT_URL,
        oauth_url: authService.generateOAuthURL('test-state')
      }
    })
  } catch (error) {
    logger.error('Debug OAuth error:', error)
    res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
}
