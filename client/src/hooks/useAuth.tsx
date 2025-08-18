import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthState } from '@/types'

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    // Check for stored auth data on mount; if missing, attempt to bootstrap from secure cookies
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')

    const finish = (next: Partial<AuthState>) => setAuthState(prev => ({ ...prev, ...next }))

    const parseAndSet = (t: string, uStr: string) => {
      try {
        const user = JSON.parse(uStr)
        setAuthState({ user, token: t, isAuthenticated: true, isLoading: false })
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        finish({ isLoading: false })
      }
    }

    if (token && userData) {
      parseAndSet(token, userData)
      return
    }

    // Attempt cookie-based session exchange silently
    (async () => {
      try {
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'https://git-viz-lytics.vercel.app'
        const res = await fetch(`${apiBaseUrl}/api/auth/session`, { credentials: 'include' })
        if (!res.ok) return finish({ isLoading: false })
        const data = await res.json()
        if (data?.success && data?.data?.token && data?.data?.user) {
          localStorage.setItem('auth_token', data.data.token)
          localStorage.setItem('user_data', JSON.stringify(data.data.user))
          setAuthState({ user: data.data.user, token: data.data.token, isAuthenticated: true, isLoading: false })
        } else {
          finish({ isLoading: false })
        }
      } catch {
        finish({ isLoading: false })
      }
    })()
  }, [])

  const login = (token: string, user: User) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(user))
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  const updateUser = (user: User) => {
    localStorage.setItem('user_data', JSON.stringify(user))
    setAuthState(prev => ({ ...prev, user }))
  }

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
