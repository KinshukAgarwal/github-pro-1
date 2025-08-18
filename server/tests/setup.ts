import dotenv from 'dotenv'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Redis from 'ioredis-mock'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Mock Redis for testing
jest.mock('ioredis', () => require('ioredis-mock'))

// Mock external APIs
jest.mock('axios')

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only'
  process.env.GITHUB_CLIENT_ID = 'test-github-client-id'
  process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret'
  process.env.GEMINI_API_KEY = 'test-gemini-api-key'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.CLIENT_URL = 'https://git-viz-lytics.vercel.app'
  process.env.SERVER_URL = 'https://git-viz-lytics.vercel.app'
})

// Global test teardown
afterAll(async () => {
  // Clean up any global resources
  await new Promise(resolve => setTimeout(resolve, 100))
})

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock fetch for API calls
global.fetch = jest.fn()

// Helper function to create mock GitHub user
export const createMockGitHubUser = (overrides = {}) => ({
  id: 12345,
  login: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: 'https://github.com/images/error/testuser_happy.gif',
  bio: 'Test user bio',
  company: 'Test Company',
  location: 'Test Location',
  blog: 'https://testuser.dev',
  twitter_username: 'testuser',
  public_repos: 10,
  followers: 100,
  following: 50,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides
})

// Helper function to create mock repository
export const createMockRepository = (overrides = {}) => ({
  id: 123456,
  name: 'test-repo',
  full_name: 'testuser/test-repo',
  description: 'A test repository',
  private: false,
  html_url: 'https://github.com/testuser/test-repo',
  language: 'TypeScript',
  stargazers_count: 10,
  watchers_count: 5,
  forks_count: 2,
  size: 1024,
  topics: ['test', 'typescript'],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-06-01T00:00:00Z',
  pushed_at: '2023-06-01T00:00:00Z',
  ...overrides
})

// Helper function to create mock analytics data
export const createMockAnalytics = (overrides = {}) => ({
  overall_score: 85,
  repository_quality: 80,
  contribution_consistency: 90,
  community_engagement: 85,
  documentation_completeness: 80,
  total_repos: 10,
  total_stars: 100,
  total_forks: 25,
  languages: [
    { name: 'TypeScript', percentage: 60 },
    { name: 'JavaScript', percentage: 30 },
    { name: 'Python', percentage: 10 }
  ],
  ...overrides
})

// Helper function to create mock JWT token
export const createMockJWT = (payload = {}) => {
  const jwt = require('jsonwebtoken')
  return jwt.sign({
    userId: '12345',
    login: 'testuser',
    access_token: 'mock-github-token',
    ...payload
  }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// Helper function to create mock request
export const createMockRequest = (overrides = {}) => ({
  headers: {},
  body: {},
  query: {},
  params: {},
  user: null,
  ip: '127.0.0.1',
  connection: { remoteAddress: '127.0.0.1' },
  ...overrides
})

// Helper function to create mock response
export const createMockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.cookie = jest.fn().mockReturnValue(res)
  res.clearCookie = jest.fn().mockReturnValue(res)
  res.setHeader = jest.fn().mockReturnValue(res)
  res.redirect = jest.fn().mockReturnValue(res)
  return res
}

// Helper function to create mock next function
export const createMockNext = () => jest.fn()

// Mock GitHub API responses
export const mockGitHubAPI = {
  getUser: jest.fn().mockResolvedValue(createMockGitHubUser()),
  getUserRepositories: jest.fn().mockResolvedValue([createMockRepository()]),
  getRepository: jest.fn().mockResolvedValue(createMockRepository()),
  getRepositoryContents: jest.fn().mockResolvedValue({
    name: 'README.md',
    content: Buffer.from('# Test Repository\n\nThis is a test repository.').toString('base64')
  })
}

// Mock Google Gemini API responses
export const mockGemini = {
  generateContent: jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        recommendations: [
          {
            title: 'Test Project',
            description: 'A test project recommendation',
            difficulty: 'intermediate',
            technologies: ['TypeScript', 'React'],
            learning_objectives: ['Learn TypeScript', 'Build React apps']
          }
        ]
      })
    }
  })
}

// Mock Redis client
export const mockRedis = new Redis()

// Test utilities
export const testUtils = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random test data
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  randomNumber: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  // Validate API response structure
  validateApiResponse: (response: any, expectedKeys: string[]) => {
    expect(response).toHaveProperty('success')
    expect(response).toHaveProperty('data')
    if (expectedKeys.length > 0) {
      expectedKeys.forEach(key => {
        expect(response.data).toHaveProperty(key)
      })
    }
  },
  
  // Validate error response structure
  validateErrorResponse: (response: any) => {
    expect(response).toHaveProperty('success', false)
    expect(response).toHaveProperty('error')
    expect(typeof response.error).toBe('string')
  }
}

// Export commonly used mocks
export {
  mockGitHubAPI,
  mockGemini,
  mockRedis
}
