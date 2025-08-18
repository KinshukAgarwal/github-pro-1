import { AuthService } from '@/services/authService'
import { GitHubService } from '@/services/githubService'
import { cacheService } from '@/services/cacheService'
import jwt from 'jsonwebtoken'
import { createMockGitHubUser, mockGitHubAPI, testUtils } from '../setup'

// Mock dependencies
jest.mock('@/services/githubService')
jest.mock('@/services/cacheService')
jest.mock('jsonwebtoken')

describe('AuthService', () => {
  let authService: AuthService
  let mockGitHubService: jest.Mocked<GitHubService>

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService()
    mockGitHubService = new GitHubService('mock-token') as jest.Mocked<GitHubService>
    
    // Mock GitHubService constructor
    ;(GitHubService as jest.MockedClass<typeof GitHubService>).mockImplementation(() => mockGitHubService)
  })

  describe('generateOAuthURL', () => {
    it('should generate a valid OAuth URL', () => {
      const state = 'test-state'
      const url = authService.generateOAuthURL(state)
      
      expect(url).toContain('https://github.com/login/oauth/authorize')
      expect(url).toContain(`client_id=${process.env.GITHUB_CLIENT_ID}`)
      expect(url).toContain(`state=${state}`)
      expect(url).toContain('scope=read:user user:email repo')
    })

    it('should generate a random state if none provided', () => {
      const url = authService.generateOAuthURL()
      
      expect(url).toContain('state=')
      expect(url).toMatch(/state=[a-f0-9]{32}/)
    })
  })

  describe('exchangeCodeForToken', () => {
    it('should exchange code for access token successfully', async () => {
      const mockResponse = {
        access_token: 'github-access-token',
        token_type: 'bearer',
        scope: 'read:user user:email repo'
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await authService.exchangeCodeForToken('test-code', 'test-state')

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: 'test-code',
            state: 'test-state'
          })
        })
      )
    })

    it('should throw error when GitHub returns error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'The provided authorization grant is invalid'
        })
      })

      await expect(authService.exchangeCodeForToken('invalid-code'))
        .rejects.toThrow('GitHub OAuth error: The provided authorization grant is invalid')
    })

    it('should throw error when request fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request'
      })

      await expect(authService.exchangeCodeForToken('test-code'))
        .rejects.toThrow('GitHub OAuth error: Bad Request')
    })
  })

  describe('createTokens', () => {
    it('should create JWT tokens successfully', async () => {
      const mockUser = createMockGitHubUser()
      mockGitHubService.getUser.mockResolvedValue(mockUser)
      
      const mockAccessToken = 'mock-access-token'
      const mockRefreshToken = 'mock-refresh-token'
      
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken)
      
      ;(cacheService.set as jest.Mock).mockResolvedValue(undefined)

      const result = await authService.createTokens(
        'github-token',
        '127.0.0.1',
        'test-user-agent'
      )

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: 3600
      })

      expect(mockGitHubService.getUser).toHaveBeenCalled()
      expect(jwt.sign).toHaveBeenCalledTimes(2)
      expect(cacheService.set).toHaveBeenCalled()
    })

    it('should throw error when user fetch fails', async () => {
      mockGitHubService.getUser.mockResolvedValue(null)

      await expect(authService.createTokens('invalid-token', '127.0.0.1', 'test-agent'))
        .rejects.toThrow('Failed to get user information from GitHub')
    })
  })

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = createMockGitHubUser()
      const mockDecoded = {
        userId: mockUser.id.toString(),
        login: mockUser.login,
        type: 'refresh'
      }
      const mockSession = {
        userId: mockUser.id.toString(),
        login: mockUser.login,
        accessToken: 'github-token',
        refreshToken: 'old-refresh-token',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)
      ;(cacheService.get as jest.Mock).mockResolvedValue(mockSession)
      mockGitHubService.getUser.mockResolvedValue(mockUser)
      
      const mockNewAccessToken = 'new-access-token'
      const mockNewRefreshToken = 'new-refresh-token'
      
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockNewAccessToken)
        .mockReturnValueOnce(mockNewRefreshToken)
      
      ;(cacheService.set as jest.Mock).mockResolvedValue(undefined)

      const result = await authService.refreshTokens(
        'old-refresh-token',
        '127.0.0.1',
        'test-agent'
      )

      expect(result).toEqual({
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
        expiresIn: 3600
      })
    })

    it('should throw error for invalid refresh token', async () => {
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      await expect(authService.refreshTokens('invalid-token', '127.0.0.1', 'test-agent'))
        .rejects.toThrow()
    })

    it('should throw error when session not found', async () => {
      const mockDecoded = {
        userId: '12345',
        login: 'testuser',
        type: 'refresh'
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)
      ;(cacheService.get as jest.Mock).mockResolvedValue(null)

      await expect(authService.refreshTokens('refresh-token', '127.0.0.1', 'test-agent'))
        .rejects.toThrow('Invalid or expired refresh token')
    })
  })

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const mockDecoded = {
        userId: '12345',
        login: 'testuser',
        access_token: 'github-token'
      }
      const mockSession = {
        userId: '12345',
        login: 'testuser',
        accessToken: 'github-token',
        refreshToken: 'refresh-token',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)
      ;(cacheService.get as jest.Mock).mockResolvedValue(mockSession)
      ;(cacheService.set as jest.Mock).mockResolvedValue(undefined)

      const result = await authService.validateToken('valid-token')

      expect(result).toEqual({
        userId: mockDecoded.userId,
        login: mockDecoded.login,
        accessToken: mockDecoded.access_token
      })

      expect(cacheService.set).toHaveBeenCalled() // Session updated with last activity
    })

    it('should throw error for invalid token', async () => {
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      await expect(authService.validateToken('invalid-token'))
        .rejects.toThrow()
    })

    it('should throw error when session not found', async () => {
      const mockDecoded = {
        userId: '12345',
        login: 'testuser',
        access_token: 'github-token'
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)
      ;(cacheService.get as jest.Mock).mockResolvedValue(null)

      await expect(authService.validateToken('valid-token'))
        .rejects.toThrow('Session not found')
    })
  })

  describe('logout', () => {
    it('should logout user successfully', async () => {
      ;(cacheService.del as jest.Mock).mockResolvedValue(1)

      await authService.logout('12345')

      expect(cacheService.del).toHaveBeenCalledWith('session:12345')
    })
  })

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      const mockKeys = ['session:12345:device1', 'session:12345:device2']
      
      ;(cacheService.keys as jest.Mock).mockResolvedValue(mockKeys)
      ;(cacheService.del as jest.Mock).mockResolvedValue(2)

      await authService.logoutAll('12345')

      expect(cacheService.keys).toHaveBeenCalledWith('session:12345*')
      expect(cacheService.del).toHaveBeenCalledWith(...mockKeys)
    })

    it('should handle no sessions found', async () => {
      ;(cacheService.keys as jest.Mock).mockResolvedValue([])

      await authService.logoutAll('12345')

      expect(cacheService.keys).toHaveBeenCalledWith('session:12345*')
      expect(cacheService.del).not.toHaveBeenCalled()
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      const now = new Date()
      const expiredDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
      const recentDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago

      const mockKeys = ['session:user1', 'session:user2']
      const mockSessions = [
        { userId: 'user1', lastActivity: expiredDate.toISOString() },
        { userId: 'user2', lastActivity: recentDate.toISOString() }
      ]

      ;(cacheService.keys as jest.Mock).mockResolvedValue(mockKeys)
      ;(cacheService.get as jest.Mock)
        .mockResolvedValueOnce(mockSessions[0])
        .mockResolvedValueOnce(mockSessions[1])
      ;(cacheService.del as jest.Mock).mockResolvedValue(1)

      await authService.cleanupExpiredSessions()

      expect(cacheService.del).toHaveBeenCalledWith('session:user1')
      expect(cacheService.del).toHaveBeenCalledTimes(1)
    })
  })
})
