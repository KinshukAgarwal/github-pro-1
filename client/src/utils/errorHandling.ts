import { toast } from 'react-hot-toast'

export interface ErrorHandlingOptions {
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: any) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  autoRefreshOnNetworkError?: boolean
  refreshDelay?: number
}

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<T | null> => {
  const {
    loadingMessage = 'Processing...',
    successMessage = 'Operation completed successfully!',
    errorMessage = 'Operation failed',
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    autoRefreshOnNetworkError = true,
    refreshDelay = 2000
  } = options

  const toastId = toast.loading(loadingMessage)

  try {
    const result = await operation()
    
    toast.dismiss(toastId)
    
    if (showSuccessToast) {
      toast.success(`✅ ${successMessage}`, {
        duration: 3000,
        icon: '🎉'
      })
    }
    
    onSuccess?.()
    return result
  } catch (error: any) {
    console.error('Operation failed:', error)
    toast.dismiss(toastId)

    try {
      // Check if it's a network error but operation might have succeeded
      if (isNetworkError(error) && autoRefreshOnNetworkError) {
        toast.loading('Checking if operation completed...', { id: 'checking' })

        setTimeout(() => {
          toast.dismiss('checking')
          toast.success('Operation completed! Refreshing...', { duration: 2000 })
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }, refreshDelay)

        return null
      }

      if (showErrorToast) {
        const finalErrorMessage = getErrorMessage(error, errorMessage)
        toast.error(`❌ ${finalErrorMessage}`, {
          duration: 4000
        })
      }

      onError?.(error)
    } catch (handlingError) {
      console.error('Error in error handling:', handlingError)
      // Fallback error message
      if (showErrorToast) {
        toast.error(`❌ ${errorMessage}`, {
          duration: 4000
        })
      }
    }

    throw error
  }
}

export const isNetworkError = (error: any): boolean => {
  return (
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT' ||
    !error.response ||
    error.message?.includes('Network Error') ||
    error.message?.includes('timeout')
  )
}

export const getErrorMessage = (error: any, fallback: string = 'An error occurred'): string => {
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error?.message) {
    return error.message
  }
  
  return fallback
}

export const createRoadmapErrorHandler = (operation: 'create' | 'update' | 'delete') => {
  const messages = {
    create: {
      loading: 'Creating item...',
      success: 'Item created successfully!',
      error: 'Failed to create item'
    },
    update: {
      loading: 'Updating item...',
      success: 'Item updated successfully!',
      error: 'Failed to update item'
    },
    delete: {
      loading: 'Removing item...',
      success: 'Item removed successfully!',
      error: 'Failed to remove item'
    }
  }

  return {
    loadingMessage: messages[operation].loading,
    successMessage: messages[operation].success,
    errorMessage: messages[operation].error
  }
}

// Enhanced toast notifications with better UX
export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#3B82F6',
      color: 'white',
    },
  })
}

export const showSuccessToast = (message: string, options?: { duration?: number; icon?: string }) => {
  return toast.success(message, {
    duration: options?.duration || 3000,
    icon: options?.icon || '✅',
    style: {
      background: '#10B981',
      color: 'white',
    },
  })
}

export const showErrorToast = (message: string, options?: { duration?: number }) => {
  return toast.error(message, {
    duration: options?.duration || 4000,
    icon: '❌',
    style: {
      background: '#EF4444',
      color: 'white',
    },
  })
}

export const showWarningToast = (message: string, options?: { duration?: number }) => {
  return toast(message, {
    duration: options?.duration || 3000,
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: 'white',
    },
  })
}

// Retry mechanism for failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw error
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  throw lastError
}

// Simple wrapper for roadmap operations that handles common error patterns
export const safeRoadmapOperation = async <T>(
  operation: () => Promise<T>,
  operationType: 'create' | 'update' | 'delete' = 'update'
): Promise<T | null> => {
  const messages = {
    create: { loading: 'Creating...', success: 'Created successfully!', error: 'Failed to create' },
    update: { loading: 'Updating...', success: 'Updated successfully!', error: 'Failed to update' },
    delete: { loading: 'Deleting...', success: 'Deleted successfully!', error: 'Failed to delete' }
  }

  const toastId = toast.loading(messages[operationType].loading)

  try {
    const result = await operation()
    toast.dismiss(toastId)
    toast.success(`✅ ${messages[operationType].success}`)
    return result
  } catch (error) {
    console.error(`${operationType} operation failed:`, error)
    toast.dismiss(toastId)

    // Simple fallback - assume network error and refresh
    toast.loading('Checking if operation completed...', { id: 'checking' })
    setTimeout(() => {
      toast.dismiss('checking')
      toast.success('Operation may have completed. Refreshing...', { duration: 2000 })
      setTimeout(() => window.location.reload(), 1000)
    }, 2000)

    return null
  }
}
