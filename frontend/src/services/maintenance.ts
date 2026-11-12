import api from './api'
import {
  Maintenance,
  MaintenanceAlert,
  MaintenanceCreateInput,
  MaintenanceUpdateInput,
  MaintenanceType,
} from '../types'

export const maintenanceService = {
  getTypes: async () => {
    const response = await api.get<MaintenanceType[]>('/api/v1/maintenance/types')
    return response.data
  },

  createType: async (name: string) => {
    const response = await api.post<MaintenanceType>(`/api/v1/maintenance/types?name=${name}`)
    return response.data
  },

  list: async (params?: { equipment_id?: number }) => {
    const response = await api.get<Maintenance[]>('/api/v1/maintenance/', { params })
    return response.data
  },

  create: async (data: MaintenanceCreateInput) => {
    const response = await api.post<Maintenance>('/api/v1/maintenance/', data)
    return response.data
  },

  get: async (id: number) => {
    const response = await api.get<Maintenance>(`/api/v1/maintenance/${id}`)
    return response.data
  },

  update: async (id: number, data: MaintenanceUpdateInput) => {
    const response = await api.put<Maintenance>(`/api/v1/maintenance/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/api/v1/maintenance/${id}`)
  },

  listAlerts: async (params?: { status?: string }) => {
    const response = await api.get<MaintenanceAlert[]>('/api/v1/maintenance/alerts', { params })
    return response.data
  },

  createAlert: async (data: Partial<MaintenanceAlert>) => {
    const response = await api.post<MaintenanceAlert>('/api/v1/maintenance/alerts', data)
    return response.data
  },

  updateAlert: async (id: number, data: Partial<MaintenanceAlert>) => {
    const response = await api.put<MaintenanceAlert>(`/api/v1/maintenance/alerts/${id}`, data)
    return response.data
  },
}
