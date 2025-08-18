import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import apiService from '@/services/api'
import { ApiResponse } from '@/types'

// Query keys
export const queryKeys = {
  user: {
    profile: ['user', 'profile'],
    repositories: (params?: any) => ['user', 'repositories', params],
    repository: (id: string) => ['user', 'repository', id],
    stats: ['user', 'stats'],
    contributions: ['user', 'contributions'],
  },
  analytics: {
    profileScore: ['analytics', 'profile-score'],
    repositoryAnalysis: ['analytics', 'repository-analysis'],
    contributionPatterns: ['analytics', 'contribution-patterns'],
    languageDistribution: ['analytics', 'language-distribution'],
    technologyTrends: ['analytics', 'technology-trends'],

    marketTrends: (tech: string, months: number = 6) => ['analytics', 'market-trends', tech, months],

  },
  recommendations: {
    projects: ['recommendations', 'projects'],
    technologies: ['recommendations', 'technologies'],
    career: ['recommendations', 'career'],
  },
  readme: {
    analysis: ['readme', 'analysis'],
    templates: ['readme', 'templates'],
    template: (id: string) => ['readme', 'template', id],
  },
  settings: {
    user: ['settings', 'user'],
  },
  roadmap: {
    list: ['roadmap'],
    stats: ['roadmap', 'stats'],
    item: (id: string) => ['roadmap', 'item', id]
  }
}

// User hooks
export const useUserProfile = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.user.profile,
    () => apiService.getUserProfile(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export const useUserRepositories = (params?: any) => {
  return useQuery<ApiResponse<any>>(
    queryKeys.user.repositories(params),
    () => apiService.getUserRepositories(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export const useRepository = (id: string) => {
  return useQuery<ApiResponse<any>>(
    queryKeys.user.repository(id),
    () => apiService.getRepository(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  )
}

export const useUserStats = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.user.stats,
    () => apiService.getUserStats(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export const useContributions = (year?: number) => {
  return useQuery<ApiResponse<any>>(
    [...queryKeys.user.contributions, year],
    () => apiService.getContributions(year),
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  )
}

export const useUserSettings = () => {
  const hasToken = !!localStorage.getItem('auth_token')
  return useQuery<ApiResponse<any>>(
    queryKeys.settings.user,
    () => apiService.getUserSettings(),
    { staleTime: 10 * 60 * 1000, enabled: hasToken }
  )
}

export const useUpdateUserSettings = () => {
  const qc = useQueryClient()
  return useMutation((data: any) => apiService.updateUserSettings(data), {
    onSuccess: () => {
      qc.invalidateQueries(queryKeys.settings.user)
    }
  })
}

// Analytics hooks
export const useProfileScore = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.analytics.profileScore,
    () => apiService.getProfileScore(),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
    }
  )
}

export const useRepositoryAnalysis = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.analytics.repositoryAnalysis,
    () => apiService.getRepositoryAnalysis(),
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  )
}

export const useContributionPatterns = (year?: number) => {
  return useQuery<ApiResponse<any>>(
    [...queryKeys.analytics.contributionPatterns, year],
    () => apiService.getContributionPatterns(year),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  )
}

export const useLanguageDistribution = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.analytics.languageDistribution,
    () => apiService.getLanguageDistribution(),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  )
}

export const useTechnologyTrends = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.analytics.technologyTrends,
    () => apiService.getTechnologyTrends(),
    {
      staleTime: 30 * 60 * 1000,
    }
  )
}

export const useMarketTrends = (tech: string, months = 6) => {
  return useQuery<ApiResponse<any>>(
    queryKeys.analytics.marketTrends(tech, months),
    () => apiService.getMarketTrends(tech, months),
    { enabled: !!tech, staleTime: 30 * 60 * 1000 }
  )
}

// Recommendations hooks
export const useProjectRecommendations = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.recommendations.projects,
    () => apiService.getProjectRecommendations(),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  )
}

export const useTechnologyRecommendations = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.recommendations.technologies,
    () => apiService.getTechnologyRecommendations(),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  )
}

export const useCareerInsights = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.recommendations.career,
    () => apiService.getCareerInsights(),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  )
}

// README hooks
export const useReadmeAnalysis = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.readme.analysis,
    () => apiService.analyzeRepositories(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export const useReadmeTemplates = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.readme.templates,
    () => apiService.getReadmeTemplates(),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    }
  )
}

export const useReadmeTemplate = (id: string) => {
  return useQuery(
    queryKeys.readme.template(id),
    () => apiService.getReadmeTemplate(id),
    {
      enabled: !!id,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  )
}

// Mutation hooks



export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: any) => apiService.updateUserProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.user.profile)
        toast.success('Profile updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.error || 'Failed to update profile')
      },
    }
  )
}

export const useRefreshAnalytics = () => {
  const queryClient = useQueryClient()

  return useMutation(
    () => apiService.refreshAnalytics(),
    {
      onSuccess: () => {
        // Invalidate all analytics queries
        queryClient.invalidateQueries(['analytics'])
        toast.success('Analytics refreshed successfully')
      },
      onError: (error: any) => {
        toast.error(error.error || 'Failed to refresh analytics')
      },
    }
  )
}

export const useGenerateRecommendations = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: any) => apiService.generateRecommendations(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['recommendations'])
        toast.success('New recommendations generated')
      },
      onError: (error: any) => {
        toast.error(error.error || 'Failed to generate recommendations')
      },
    }
  )
}

export const useGenerateReadme = () => {
  return useMutation(
    (data: any) => apiService.generateReadme(data),
    {
      onSuccess: () => {
        toast.success('README generated successfully')
      },
      onError: (error: any) => {
        toast.error(error.error || 'Failed to generate README')
      },
    }
  )
}

export const usePublishReadme = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: any) => apiService.publishReadme(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.readme.analysis)
        // Don't show toast here, let the component handle it for better UX
      },
      onError: (error: any) => {
        console.error('Publish README error:', error)
        // Don't show toast here, let the component handle specific error messages
      },
      retry: (failureCount, error: any) => {
        // Retry for network errors but not for client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false // Don't retry client errors
        }
        return failureCount < 2 // Retry up to 2 times for server/network errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    }
  )
}

// Roadmap hooks
export const useRoadmap = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.roadmap.list,
    () => apiService.getRoadmap(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export const useRoadmapStats = () => {
  return useQuery<ApiResponse<any>>(
    queryKeys.roadmap.stats,
    () => apiService.getRoadmapStats(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export const useRoadmapItem = (itemId: string) => {
  return useQuery<ApiResponse<any>>(
    queryKeys.roadmap.item(itemId),
    () => apiService.getRoadmap(), // Will filter on frontend
    {
      staleTime: 2 * 60 * 1000,
      enabled: !!itemId
    }
  )
}

// Roadmap mutation hooks
export const useAddRoadmapItem = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async (item: any) => {
      try {
        const response = await apiService.addRoadmapItem(item)
        return response
      } catch (error: any) {
        // Log the error but don't throw if the operation might have succeeded
        console.error('Add roadmap item error:', error)

        // Check if it's a network error or timeout - operation might have succeeded
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || !error.response) {
          // Wait a bit and check if the item was actually created
          await new Promise(resolve => setTimeout(resolve, 1000))
          try {
            await queryClient.invalidateQueries(queryKeys.roadmap.list)
            const roadmapData = await queryClient.fetchQuery(queryKeys.roadmap.list, () => apiService.getRoadmap())
            const items = Array.isArray(roadmapData?.data) ? roadmapData.data : []
            const itemExists = items.some((existingItem: any) => existingItem.name === item.name)
            if (itemExists) {
              return { success: true, data: item }
            }
          } catch (checkError) {
            console.error('Error checking if item was created:', checkError)
          }
        }
        throw error
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.roadmap.list)
        queryClient.invalidateQueries(queryKeys.roadmap.stats)
      },
      onError: (error: any) => {
        console.error('Add roadmap item error:', error)
      },
      retry: (failureCount, error: any) => {
        // Don't retry if it's a validation error (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 2 times for network errors
        return failureCount < 2
      },
      retryDelay: 1000
    }
  )
}

export const useUpdateRoadmapItem = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async ({ itemId, updates }: { itemId: string; updates: any }) => {
      try {
        const response = await apiService.updateRoadmapItem(itemId, updates)
        return response
      } catch (error: any) {
        console.error('Update roadmap item error:', error)

        // Check if it's a network error - operation might have succeeded
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || !error.response) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          try {
            await queryClient.invalidateQueries(queryKeys.roadmap.list)
            return { success: true, data: updates }
          } catch (checkError) {
            console.error('Error checking if update succeeded:', checkError)
          }
        }
        throw error
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.roadmap.list)
        queryClient.invalidateQueries(queryKeys.roadmap.stats)
      },
      onError: (error: any) => {
        console.error('Update roadmap item error:', error)
      },
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 2
      },
      retryDelay: 1000
    }
  )
}

export const useRemoveRoadmapItem = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async (itemId: string) => {
      try {
        const response = await apiService.deleteRoadmapItem(itemId)
        return response
      } catch (error: any) {
        console.error('Remove roadmap item error:', error)

        // Check if it's a network error - operation might have succeeded
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || !error.response) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          try {
            await queryClient.invalidateQueries(queryKeys.roadmap.list)
            const roadmapData = await queryClient.fetchQuery(queryKeys.roadmap.list, () => apiService.getRoadmap())
            const items = Array.isArray(roadmapData?.data) ? roadmapData.data : []
            const itemExists = items.some((existingItem: any) => existingItem.id === itemId)
            if (!itemExists) {
              return { success: true, message: 'Item deleted successfully' }
            }
          } catch (checkError) {
            console.error('Error checking if item was deleted:', checkError)
          }
        }
        throw error
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.roadmap.list)
        queryClient.invalidateQueries(queryKeys.roadmap.stats)
      },
      onError: (error: any) => {
        console.error('Remove roadmap item error:', error)
      },
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 2
      },
      retryDelay: 1000
    }
  )
}
