// Test file to verify error handling works correctly
import { getErrorMessage, isNetworkError, safeRoadmapOperation } from './errorHandling'

// Test cases for error message extraction
export const testErrorMessageExtraction = () => {
  console.log('Testing error message extraction...')
  
  // Test case 1: Normal error with response.data.error
  const error1 = {
    response: {
      data: {
        error: 'Test error message'
      }
    }
  }
  console.log('Test 1:', getErrorMessage(error1)) // Should return 'Test error message'
  
  // Test case 2: Error with response.data.message
  const error2 = {
    response: {
      data: {
        message: 'Test message'
      }
    }
  }
  console.log('Test 2:', getErrorMessage(error2)) // Should return 'Test message'
  
  // Test case 3: Error with just message
  const error3 = {
    message: 'Simple error message'
  }
  console.log('Test 3:', getErrorMessage(error3)) // Should return 'Simple error message'
  
  // Test case 4: Undefined error
  const error4 = undefined
  console.log('Test 4:', getErrorMessage(error4)) // Should return 'An error occurred'
  
  // Test case 5: Null error
  const error5 = null
  console.log('Test 5:', getErrorMessage(error5)) // Should return 'An error occurred'
  
  // Test case 6: Error with nested undefined properties
  const error6 = {
    response: {
      data: undefined
    }
  }
  console.log('Test 6:', getErrorMessage(error6)) // Should return 'An error occurred'
  
  // Test case 7: String error
  const error7 = 'String error'
  console.log('Test 7:', getErrorMessage(error7)) // Should return 'String error'
}

// Test cases for network error detection
export const testNetworkErrorDetection = () => {
  console.log('Testing network error detection...')
  
  // Test case 1: Network error
  const networkError1 = {
    code: 'NETWORK_ERROR'
  }
  console.log('Network Test 1:', isNetworkError(networkError1)) // Should return true
  
  // Test case 2: Timeout error
  const timeoutError = {
    code: 'TIMEOUT'
  }
  console.log('Network Test 2:', isNetworkError(timeoutError)) // Should return true
  
  // Test case 3: No response
  const noResponseError = {
    message: 'Network Error'
  }
  console.log('Network Test 3:', isNetworkError(noResponseError)) // Should return true
  
  // Test case 4: Regular error
  const regularError = {
    response: {
      status: 400,
      data: {
        error: 'Bad request'
      }
    }
  }
  console.log('Network Test 4:', isNetworkError(regularError)) // Should return false
  
  // Test case 5: Undefined error
  const undefinedError = undefined
  console.log('Network Test 5:', isNetworkError(undefinedError)) // Should return false
}

// Test the safe roadmap operation
export const testSafeRoadmapOperation = async () => {
  console.log('Testing safe roadmap operation...')
  
  // Mock successful operation
  const successOperation = () => Promise.resolve({ success: true, data: 'test' })
  
  try {
    const result = await safeRoadmapOperation(successOperation, 'create')
    console.log('Success test result:', result)
  } catch (error) {
    console.error('Success test failed:', error)
  }
  
  // Mock failing operation
  const failOperation = () => Promise.reject(new Error('Test error'))
  
  try {
    const result = await safeRoadmapOperation(failOperation, 'create')
    console.log('Fail test result:', result)
  } catch (error) {
    console.log('Fail test handled correctly')
  }
}

// Run all tests (for development only)
export const runAllTests = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Running error handling tests...')
    testErrorMessageExtraction()
    testNetworkErrorDetection()
    testSafeRoadmapOperation()
    console.log('Error handling tests completed.')
  }
}
