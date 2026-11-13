import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import api from '../services/api'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  organization_name?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedAccessToken = localStorage.getItem('access_token')
        const storedRefreshToken = localStorage.getItem('refresh_token')
        const storedUser = localStorage.getItem('user')

        if (!storedAccessToken || !storedRefreshToken) {
          setAccessToken(null)
          setRefreshToken(null)
          setUser(null)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          return
        }

        setAccessToken(storedAccessToken)
        setRefreshToken(storedRefreshToken)

        if (storedUser) {
          setUser(JSON.parse(storedUser) as User)
        } else {
          const payload = JSON.parse(atob(storedAccessToken.split('.')[1]))
          setUser({
            id: Number(payload.sub),
            email: payload.email,
            full_name: 'Usuário',
            role: 'user',
            organization_id: payload.organization_id,
            is_active: true,
            created_at: '',
          })
        }

        const response = await api.get<User>('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${storedAccessToken}` },
        })
        setUser(response.data)
        setAccessToken(localStorage.getItem('access_token') || storedAccessToken)
        setRefreshToken(localStorage.getItem('refresh_token') || storedRefreshToken)
        localStorage.setItem('user', JSON.stringify(response.data))
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setAccessToken(null)
          setRefreshToken(null)
          setUser(null)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
        } else {
          console.error('Error restoring saved session:', error)
        }
      }
    }

    void restoreSession().finally(() => setIsLoading(false))
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
    const profileResponse = await axios.get<User>(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const userData = profileResponse.data

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
    isAuthenticated: !!accessToken && !!user,
    isLoading,
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
