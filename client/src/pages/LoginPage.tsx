import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github, Shield, Zap, BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  // On mount or when returning from OAuth (?auth=success), try to exchange session cookies for a token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authSuccess = params.get('auth') === 'success'

    async function bootstrapFromSession() {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://git-viz-lytics.vercel.app'
        const res = await fetch(`${apiBaseUrl}/api/auth/session`, {
          credentials: 'include'
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.success && data?.data?.token && data?.data?.user) {
          login(data.data.token, data.data.user)
          // Clean up the query param
          params.delete('auth')
          const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
          window.history.replaceState({}, '', newUrl)
          navigate(from, { replace: true })
        }
      } catch (e) {
        // ignore; user can click login button again
      }
    }

    if (authSuccess) {
      bootstrapFromSession()
    }
  }, [navigate, from])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleGitHubLogin = () => {
    // Redirect to backend OAuth endpoint which will handle the GitHub OAuth flow
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'
    // Redirect back to /login so we can bootstrap from session cookies reliably
    const redirectUri = `${window.location.origin}/login`

    const backendOAuthUrl = `${apiBaseUrl}/api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`

    window.location.href = backendOAuthUrl
  }

  const features = [
    {
      icon: BarChart3,
      title: 'Comprehensive Analytics',
      description: 'Get detailed insights into your GitHub profile performance'
    },
    {
      icon: Zap,
      title: 'AI-Powered Recommendations',
      description: 'Receive personalized suggestions for career growth'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Github className="h-12 w-12 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to GitHub Analytics
            </h1>
            <p className="text-gray-600">
              Sign in with your GitHub account to get started
            </p>
          </div>

          <button
            onClick={handleGitHubLogin}
            className="w-full btn-primary flex items-center justify-center space-x-3 py-3 text-lg"
          >
            <Github className="h-5 w-5" />
            <span>Continue with GitHub</span>
          </button>

          <div className="mt-8 space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <feature.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
