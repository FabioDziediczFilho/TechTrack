import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: number
  email: string
  full_name: string
  role: string
  organization_id: number
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  organization_name: string
  organization_slug: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token')
    const storedRefreshToken = localStorage.getItem('refresh_token')
    const storedUser = localStorage.getItem('user')

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken)
      setRefreshToken(storedRefreshToken)

      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else if (storedAccessToken) {
        // Decode JWT to get user data if not in localStorage
        try {
          const payload = JSON.parse(atob(storedAccessToken.split('.')[1]))
          const userData: User = {
            id: parseInt(payload.sub),
            email: payload.email,
            full_name: 'User',
            role: 'user',
            organization_id: payload.organization_id,
          }
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } catch (error) {
          console.error('Error decoding JWT:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [accessToken])

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email,
      password,
    })

    const { access_token, refresh_token } = response.data

    // Decode JWT to get user data (simplified approach)
    const payload = JSON.parse(atob(access_token.split('.')[1]))
    const userData: User = {
      id: parseInt(payload.sub),
      email: payload.email,
      full_name: 'User', // Will be updated later if needed
      role: 'user',
      organization_id: payload.organization_id,
    }

    setAccessToken(access_token)
    setRefreshToken(refresh_token)
    setUser(userData)

    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const register = async (data: RegisterData) => {
    await axios.post(`${API_URL}/api/v1/auth/register`, data)
  }

  const logout = async () => {
    if (refreshToken) {
      try {
        await axios.post(`${API_URL}/api/v1/auth/logout`, { refresh_token: refreshToken })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    isAuthenticated: !!accessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
