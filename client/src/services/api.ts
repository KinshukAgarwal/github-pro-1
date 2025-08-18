import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ApiResponse } from '@/types'

class ApiService {
  private client: AxiosInstance
  private baseURL: string
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://git-viz-lytics.vercel.app'

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise
    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        // Ask server to refresh cookies
        await this.client.post('/api/auth/refresh', {})
        // Exchange cookie for token
        const session = await this.client.get('/api/auth/session')
        const token = session?.data?.data?.token as string | undefined
        const user = session?.data?.data?.user
        if (token && user) {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user_data', JSON.stringify(user))
          return token
        }
        return null
      } catch (e) {
        return null
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()
    return this.refreshPromise
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers = config.headers || {}
          ;(config.headers as any).Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor with auto-refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {}
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          const newToken = await this.refreshToken()
          if (newToken) {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.client.request(originalRequest)
          }
          // fallthrough to logout if refresh failed
        }

        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config)
      return response.data
    } catch (error: any) {
      // Add error codes for better handling
      if (!error.response) {
        // Network error
        error.code = 'NETWORK_ERROR'
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        error.code = 'TIMEOUT'
      }

      if (error.response?.data) {
        // Preserve the error code
        const responseError = error.response.data
        responseError.code = error.code
        throw responseError
      }

      throw {
        success: false,
        error: error.message || 'Network error occurred',
        code: error.code
      }
    }
  }

  // Auth endpoints
  async getCurrentUser() {
    return this.request({
      method: 'GET',
      url: '/api/auth/me'
    })
  }

  async logout() {
    return this.request({
      method: 'POST',
      url: '/api/auth/logout'
    })
  }

  // User endpoints
  async getUserProfile() {
    return this.request({
      method: 'GET',
      url: '/api/user/profile'
    })
  }

  async updateUserProfile(data: any) {
    return this.request({
      method: 'PUT',
      url: '/api/user/profile',
      data
    })
  }

  async getUserSettings() {
    return this.request({
      method: 'GET',
      url: '/api/user/settings'
    })
  }

  async updateUserSettings(data: any) {
    return this.request({
      method: 'PUT',
      url: '/api/user/settings',
      data
    })
  }

  async getUserRepositories(params?: {
    page?: number
    per_page?: number
    sort?: string
    type?: string
  }) {
    return this.request({
      method: 'GET',
      url: '/api/user/repositories',
      params
    })
  }

  async getRepository(id: string) {
    return this.request({
      method: 'GET',
      url: `/api/user/repositories/${id}`
    })
  }

  async getUserStats() {
    return this.request({
      method: 'GET',
      url: '/api/user/stats'
    })
  }

  async getContributions(year?: number) {
    const params = year ? { year: year.toString() } : {}
    return this.request({
      method: 'GET',
      url: '/api/user/contributions',
      params
    })
  }

  // Analytics endpoints
  async getProfileScore() {
    return this.request({
      method: 'GET',
      url: '/api/analytics/profile-score'
    })
  }

  async getRepositoryAnalysis() {
    return this.request({
      method: 'GET',
      url: '/api/analytics/repository-analysis'
    })
  }

  async getContributionPatterns(year?: number) {
    const params = year ? { year: year.toString() } : {}
    return this.request({
      method: 'GET',
      url: '/api/analytics/contribution-patterns',
      params
    })
  }

  async getLanguageDistribution() {
    return this.request({
      method: 'GET',
      url: '/api/analytics/language-distribution'
    })
  }

  async refreshAnalytics() {
    return this.request({
      method: 'POST',
      url: '/api/analytics/refresh'
    })
  }

  async exportAnalytics(format: 'pdf' | 'json' = 'json') {
    return this.request({
      method: 'GET',
      url: '/api/analytics/export',
      params: { format }
    })
  }

  async getTechnologyTrends() {
    return this.request({
      method: 'GET',
      url: '/api/analytics/technology-trends'
    })
  }


  async getMarketTrends(tech: string, months = 6) {
    return this.request({
      method: 'GET',
      url: '/api/analytics/market-trends',
      params: { tech, months }
    })
  }


  // Recommendations endpoints
  async getProjectRecommendations() {
    return this.request({
      method: 'GET',
      url: '/api/recommendations/projects'
    })
  }

  async getTechnologyRecommendations() {
    return this.request({
      method: 'GET',
      url: '/api/recommendations/technologies'
    })
  }

  async getCareerInsights() {
    return this.request({
      method: 'GET',
      url: '/api/recommendations/career'
    })
  }

  async generateRecommendations(data: any) {
    return this.request({
      method: 'POST',
      url: '/api/recommendations/generate',
      data
    })
  }

  async submitRecommendationFeedback(id: string, feedback: any) {
    return this.request({
      method: 'POST',
      url: `/api/recommendations/${id}/feedback`,
      data: feedback
    })
  }




  // README endpoints
  async analyzeRepositories() {
    return this.request({
      method: 'GET',
      url: '/api/readme/analyze'
    })
  }

  async analyzeRepository(repoId: string) {
    return this.request({
      method: 'GET',
      url: `/api/readme/analyze/${repoId}`
    })
  }

  async generateReadme(data: any) {
    return this.request({
      method: 'POST',
      url: '/api/readme/generate',
      data
    })
  }

  async getReadmeTemplates() {
    return this.request({
      method: 'GET',
      url: '/api/readme/templates'
    })
  }

  async getReadmeTemplate(id: string) {
    return this.request({
      method: 'GET',
      url: `/api/readme/templates/${id}`
    })
  }

  async publishReadme(data: any) {
    return this.request({
      method: 'POST',
      url: '/api/readme/publish',
      data
    })
  }

  // Health check
  async healthCheck() {
    return this.request({
      method: 'GET',
      url: '/health'
    })
  }

  // Roadmap API methods
  async getRoadmap() {
    return this.request({
      method: 'GET',
      url: '/api/roadmap'
    })
  }

  async addRoadmapItem(item: any) {
    return this.request({
      method: 'POST',
      url: '/api/roadmap',
      data: item
    })
  }

  async updateRoadmapItem(itemId: string, updates: any) {
    return this.request({
      method: 'PUT',
      url: `/api/roadmap/${itemId}`,
      data: updates
    })
  }

  async deleteRoadmapItem(itemId: string) {
    return this.request({
      method: 'DELETE',
      url: `/api/roadmap/${itemId}`
    })
  }

  async updateRoadmapProgress(itemId: string, progress: any) {
    return this.request({
      method: 'PATCH',
      url: `/api/roadmap/${itemId}/progress`,
      data: progress
    })
  }

  async getRoadmapStats() {
    return this.request({
      method: 'GET',
      url: '/api/roadmap/stats'
    })
  }
}

// Create singleton instance
export const apiService = new ApiService()
export default apiService
