import { useMutation, useQuery } from 'react-query'
import { toast } from 'react-hot-toast'


export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'xlsx' | 'xml'
  includeRecommendations?: boolean
  includeAnalytics?: boolean
  includeRepositories?: boolean
  includeContributions?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

export interface ExportFormat {
  id: string
  name: string
  description: string
  mime_type: string
  file_extension: string
}

export interface ShareOptions {
  includePrivateData?: boolean
  expiresIn?: string
  allowedDomains?: string[]
}

export interface ShareLink {
  share_url: string
  share_token: string
  expires_at: string
  settings: {
    includePrivateData: boolean
    allowedDomains: string[]
  }
}

export interface SocialShareData {
  platform: string
  content: any
  share_urls: {
    twitter: string
    linkedin: string
    facebook: string
  }
}

// Helper function to get auth token
const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token')
  console.log('getAuthToken - Token exists:', !!token)
  console.log('getAuthToken - Token length:', token?.length || 0)
  if (!token) {
    throw new Error('Authentication required. Please log in again.')
  }
  return token
}

// Hook for exporting profile data
export const useExportProfile = () => {
  return useMutation<Blob, Error, ExportOptions>(
    async (options: ExportOptions) => {
      const token = getAuthToken()

      const response = await fetch('/api/export/profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        }
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(errorData.error || `Export failed with status ${response.status}`)
      }

      return response.blob()
    },
    {
      onSuccess: (blob, options) => {
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const timestamp = new Date().toISOString().split('T')[0]
        link.download = `github-profile-${timestamp}.${options.format}`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success(`Profile exported as ${options.format.toUpperCase()}`)
      },
      onError: (error) => {
        console.error('Export error:', error)
        toast.error(error.message || 'Failed to export profile')
      }
    }
  )
}

// Hook for getting available export formats
export const useExportFormats = () => {
  return useQuery<{ formats: ExportFormat[]; options: any }>('exportFormats', async () => {
    try {
      const token = getAuthToken()

      const response = await fetch('/api/export/formats', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        }
        throw new Error('Failed to get export formats')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Export formats error:', error)
      // Return fallback formats if API fails
      return {
        formats: [
          { id: 'json', name: 'JSON', description: 'Raw data format', mime_type: 'application/json', file_extension: 'json' },
          { id: 'csv', name: 'CSV', description: 'Spreadsheet format', mime_type: 'text/csv', file_extension: 'csv' },
          { id: 'pdf', name: 'PDF', description: 'Document format', mime_type: 'application/pdf', file_extension: 'pdf' },
          { id: 'xlsx', name: 'Excel', description: 'Excel workbook', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', file_extension: 'xlsx' },
          { id: 'xml', name: 'XML', description: 'Structured data', mime_type: 'application/xml', file_extension: 'xml' }
        ],
        options: {}
      }
    }
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Hook for generating shareable links
export const useGenerateShareLink = () => {
  return useMutation<ShareLink, Error, ShareOptions>(
    async (options: ShareOptions) => {
      const token = getAuthToken()

      const response = await fetch('/api/export/share', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate share link')
      }

      const data = await response.json()
      return data.data
    },
    {
      onSuccess: (shareLink) => {
        // Copy to clipboard
        navigator.clipboard.writeText(shareLink.share_url).then(() => {
          toast.success('Share link copied to clipboard!')
        }).catch(() => {
          toast.success('Share link generated successfully')
        })
      },
      onError: (error) => {
        console.error('Share link generation error:', error)
        toast.error(error.message || 'Failed to generate share link')
      }
    }
  )
}

// Hook for getting social media share data
export const useSocialShare = (platform: string = 'twitter') => {
  return useQuery<SocialShareData>(['socialShare', platform], async () => {
    const response = await fetch(`/api/export/social?platform=${platform}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to get social share data')
    }

    const data = await response.json()
    return data.data
  }, {
    enabled: !!platform,
    staleTime: 5 * 60 * 1000
  })
}

// Hook for sharing to social media
export const useShareToSocial = () => {
  return useMutation<void, Error, { platform: string; url?: string }>(
    async ({ platform, url }) => {
      if (url) {
        // Open the provided URL
        window.open(url, '_blank', 'width=600,height=400')
      } else {
        // Get share data and open
        const response = await fetch(`/api/export/social?platform=${platform}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to get social share data')
        }

        const data = await response.json()
        const shareUrl = data.data.share_urls[platform]
        
        if (shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400')
        } else {
          throw new Error('Share URL not available for this platform')
        }
      }
    },
    {
      onSuccess: () => {
        toast.success('Opened social media share dialog')
      },
      onError: (error) => {
        console.error('Social share error:', error)
        toast.error(error.message || 'Failed to share to social media')
      }
    }
  )
}

// Utility function to download data as file
export const downloadData = (data: any, filename: string, type: string = 'application/json') => {
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Utility function to copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// Hook for bulk export operations
export const useBulkExport = () => {
  return useMutation<void, Error, { formats: string[]; options: Partial<ExportOptions> }>(
    async ({ formats, options }) => {
      const promises = formats.map(format => 
        fetch('/api/export/profile', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...options, format })
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to export ${format}`)
          }
          return response.blob().then(blob => ({ format, blob }))
        })
      )

      const results = await Promise.all(promises)
      
      // Download all files
      results.forEach(({ format, blob }) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const timestamp = new Date().toISOString().split('T')[0]
        link.download = `github-profile-${timestamp}.${format}`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      })
    },
    {
      onSuccess: (_, { formats }) => {
        toast.success(`Successfully exported ${formats.length} files`)
      },
      onError: (error) => {
        console.error('Bulk export error:', error)
        toast.error(error.message || 'Failed to export files')
      }
    }
  )
}
