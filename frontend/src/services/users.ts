import api from './api'
import { User, UserRole } from '../types'

export interface UserCreateInput {
  email: string
  full_name: string
  password: string
  role: UserRole
}

export type UserUpdateInput = Partial<Pick<User, 'email' | 'full_name' | 'role' | 'is_active'>>

export const usersService = {
  list: async () => {
    const response = await api.get<User[]>('/api/v1/users/')
    return response.data
  },

  create: async (data: UserCreateInput) => {
    const response = await api.post<User>('/api/v1/users/', data)
    return response.data
  },

  update: async (id: number, data: UserUpdateInput) => {
    const response = await api.put<User>(`/api/v1/users/${id}`, data)
    return response.data
  },
}
