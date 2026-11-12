import api from './api'
import { Equipment, EquipmentType } from '../types'

export const equipmentService = {
  getTypes: async () => {
    const response = await api.get<EquipmentType[]>('/api/v1/equipment/types')
    return response.data
  },

  createType: async (name: string) => {
    const response = await api.post<EquipmentType>(`/api/v1/equipment/types?name=${name}`)
    return response.data
  },

  list: async (params?: { type_id?: number; status?: string; search?: string }) => {
    const response = await api.get<Equipment[]>('/api/v1/equipment/', { params })
    return response.data
  },

  create: async (data: Partial<Equipment>) => {
    const response = await api.post<Equipment>('/api/v1/equipment/', data)
    return response.data
  },

  get: async (id: number) => {
    const response = await api.get<Equipment>(`/api/v1/equipment/${id}`)
    return response.data
  },

  update: async (id: number, data: Partial<Equipment>) => {
    const response = await api.put<Equipment>(`/api/v1/equipment/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/api/v1/equipment/${id}`)
  },

  getHistory: async (id: number) => {
    const response = await api.get(`/api/v1/equipment/${id}/history`)
    return response.data
  },
}
