// frontend/src/context/AuthContext.tsx
// Authentication context and provider

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { setAuthToken } from '../services/api'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (data.session) {
          const token = data.session.access_token
          setToken(token)
          setAuthToken(token)
          
          // Extract user info from JWT
          const decoded = JSON.parse(atob(token.split('.')[1]))
          setUser({
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role || 'viewer'
          })
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      const token = data.session?.access_token || ''
      setToken(token)
      setAuthToken(token)
      
      const decoded = JSON.parse(atob(token.split('.')[1]))
      setUser({
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'viewer'
      })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setToken(null)
      setAuthToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
