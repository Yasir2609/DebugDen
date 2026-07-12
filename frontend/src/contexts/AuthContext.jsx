import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

/**
 * AuthContext provides global authentication state.
 * Holds user data, access token, and login/logout functions.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  /** Check for existing session on mount */
  useEffect(() => {
    const stored = localStorage.getItem('accessToken')
    if (stored) {
      setAccessToken(stored)
      api.get('/auth/user')
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('accessToken')
          setAccessToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  /** Login: store token and fetch user */
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const token = res.data.accessToken
    localStorage.setItem('accessToken', token)
    setAccessToken(token)
    setUser(res.data.user)
    return res.data
  }, [])

  /** Register: create account, then login */
  const register = useCallback(async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    const token = res.data.accessToken
    localStorage.setItem('accessToken', token)
    setAccessToken(token)
    setUser(res.data.user)
    return res.data
  }, [])

  /** Logout: clear token and user state */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors — clear local state regardless
    }
    localStorage.removeItem('accessToken')
    setAccessToken(null)
    setUser(null)
  }, [])

  /** Update user data in context (e.g., after profile edit) */
  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }))
  }, [])

  const isAuthenticated = !!user && !!accessToken

  const value = {
    user,
    accessToken,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/** Custom hook to access auth context */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
