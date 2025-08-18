import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from '@/routes/auth'
import { authService } from '@/services/authService'
import { GitHubService } from '@/services/githubService'
import { createMockGitHubUser, createMockJWT, testUtils } from '../setup'

// Mock dependencies
jest.mock('@/services/authService')
jest.mock('@/services/githubService')

describe('Auth Integration Tests', () => {
  let app: express.Application
  let mockAuthService: jest.Mocked<typeof authService>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup Express app
    app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/api/auth', authRoutes)
    
    mockAuthService = authService as jest.Mocked<typeof authService>
  })

  describe('GET /api/auth/github', () => {
    it('should initiate GitHub OAuth flow', async () => {
      const mockOAuthUrl = 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=test&scope=read:user'
      mockAuthService.generateOAuthURL.mockReturnValue(mockOAuthUrl)

      const response = await request(app)
        .get('/api/auth/github')
        .expect(302)

      expect(response.headers.location).toBe(mockOAuthUrl)
      expect(mockAuthService.generateOAuthURL).toHaveBeenCalled()
    })

    it('should handle redirect_uri parameter', async () => {
      const mockOAuthUrl = 'https://github.com/login/oauth/authorize?client_id=test'
      mockAuthService.generateOAuthURL.mockReturnValue(mockOAuthUrl)

      const response = await request(app)
        .get('/api/auth/github?redirect_uri=http://localhost:3000/dashboard')
        .expect(302)

      expect(response.headers['set-cookie']).toBeDefined()
      expect(response.headers['set-cookie'][0]).toContain('auth_redirect')
    })
  })

  describe('GET /api/auth/github/callback', () => {
    it('should handle successful OAuth callback', async () => {
      const mockTokens = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        expiresIn: 3600
      }
      const mockUser = createMockGitHubUser()

      mockAuthService.exchangeCodeForToken.mockResolvedValue({
        access_token: 'github-access-token',
        token_type: 'bearer',
        scope: 'read:user'
      })
      mockAuthService.createTokens.mockResolvedValue(mockTokens)

      // Mock GitHubService
      const mockGitHubService = {
        getUser: jest.fn().mockResolvedValue(mockUser)
      }
      ;(GitHubService as jest.MockedClass<typeof GitHubService>).mockImplementation(() => mockGitHubService as any)

      const response = await request(app)
        .get('/api/auth/github/callback?code=test-code&state=test-state')
        .expect(302)

      expect(response.headers.location).toContain('auth=success')
      expect(response.headers['set-cookie']).toBeDefined()
      
      const cookies = response.headers['set-cookie']
      expect(cookies.some((cookie: string) => cookie.includes('access_token'))).toBe(true)
      expect(cookies.some((cookie: string) => cookie.includes('refresh_token'))).toBe(true)

      expect(mockAuthService.exchangeCodeForToken).toHaveBeenCalledWith('test-code', 'test-state')
      expect(mockAuthService.createTokens).toHaveBeenCalled()
    })

    it('should handle OAuth callback without code', async () => {
      const response = await request(app)
        .get('/api/auth/github/callback')
        .expect(302)

      expect(response.headers.location).toContain('error=auth_failed')
    })

    it('should handle OAuth callback errors', async () => {
      mockAuthService.exchangeCodeForToken.mockRejectedValue(new Error('OAuth exchange failed'))

      const response = await request(app)
        .get('/api/auth/github/callback?code=invalid-code')
        .expect(302)

      expect(response.headers.location).toContain('error=auth_failed')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = createMockGitHubUser()
      const mockToken = createMockJWT()

      // Mock GitHubService
      const mockGitHubService = {
        getUser: jest.fn().mockResolvedValue(mockUser)
      }
      ;(GitHubService as jest.MockedClass<typeof GitHubService>).mockImplementation(() => mockGitHubService as any)

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200)

      testUtils.validateApiResponse(response.body, ['user'])
      expect(response.body.data.user).toMatchObject({
        id: mockUser.id,
        login: mockUser.login,
        name: mockUser.name,
        email: mockUser.email
      })
    })

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      testUtils.validateErrorResponse(response.body)
      expect(response.body.error).toBe('Access token required')
    })

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      testUtils.validateErrorResponse(response.body)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      }

      mockAuthService.refreshTokens.mockResolvedValue(mockTokens)

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refresh_token=valid-refresh-token')
        .expect(200)

      testUtils.validateApiResponse(response.body, ['access_token', 'expires_in'])
      expect(response.body.data.access_token).toBe(mockTokens.accessToken)
      expect(response.body.data.expires_in).toBe(mockTokens.expiresIn)

      const cookies = response.headers['set-cookie']
      expect(cookies.some((cookie: string) => cookie.includes('access_token'))).toBe(true)
      expect(cookies.some((cookie: string) => cookie.includes('refresh_token'))).toBe(true)
    })

    it('should handle refresh with body token', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      }

      mockAuthService.refreshTokens.mockResolvedValue(mockTokens)

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' })
        .expect(200)

      testUtils.validateApiResponse(response.body, ['access_token'])
    })

    it('should return 401 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401)

      testUtils.validateErrorResponse(response.body)
      expect(response.body.error).toBe('Refresh token is required')
    })

    it('should return 401 when refresh token is invalid', async () => {
      mockAuthService.refreshTokens.mockRejectedValue(new Error('Invalid refresh token'))

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refresh_token=invalid-token')
        .expect(401)

      testUtils.validateErrorResponse(response.body)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      const mockToken = createMockJWT()
      mockAuthService.logout.mockResolvedValue()

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200)

      testUtils.validateApiResponse(response.body, ['message'])
      expect(response.body.data.message).toBe('Logged out successfully')

      // Check that cookies are cleared
      const cookies = response.headers['set-cookie']
      expect(cookies.some((cookie: string) => cookie.includes('access_token=;'))).toBe(true)
      expect(cookies.some((cookie: string) => cookie.includes('refresh_token=;'))).toBe(true)
    })

    it('should logout even when not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200)

      testUtils.validateApiResponse(response.body, ['message'])
    })

    it('should handle logout service errors gracefully', async () => {
      const mockToken = createMockJWT()
      mockAuthService.logout.mockRejectedValue(new Error('Logout service error'))

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(500)

      testUtils.validateErrorResponse(response.body)
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to refresh endpoint', async () => {
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'token',
        expiresIn: 3600
      })

      // Make multiple requests quickly
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/auth/refresh')
          .send({ refresh_token: 'test-token' })
      )

      const responses = await Promise.all(requests)
      
      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(res => res.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-xss-protection']).toBe('1; mode=block')
    })
  })
})
