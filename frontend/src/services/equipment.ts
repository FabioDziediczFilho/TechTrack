import api from './api'
import {
  Equipment,
  EquipmentCreateInput,
  EquipmentType,
  Sector,
  SectorInput,
} from '../types'

export const equipmentService = {
  getTypes: async () => {
    const response = await api.get<EquipmentType[]>('/api/v1/equipment/types')
    return response.data
  },

  createType: async (name: string) => {
    const response = await api.post<EquipmentType>(`/api/v1/equipment/types?name=${name}`)
    return response.data
  },

  getSectors: async () => {
    const response = await api.get<Sector[]>('/api/v1/equipment/sectors')
    return response.data
  },

  createSector: async (sector: SectorInput) => {
    const response = await api.post<Sector>('/api/v1/equipment/sectors', sector)
    return response.data
  },

  updateSector: async (id: number, sector: Partial<SectorInput>) => {
    const response = await api.put<Sector>(`/api/v1/equipment/sectors/${id}`, sector)
    return response.data
  },

  deleteSector: async (id: number) => {
    await api.delete(`/api/v1/equipment/sectors/${id}`)
  },

  list: async (params?: {
    type_id?: number
    status?: string
    search?: string
    skip?: number
    limit?: number
  }) => {
    const response = await api.get<Equipment[]>('/api/v1/equipment/', { params })
    return response.data
  },

  create: async (data: EquipmentCreateInput) => {
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
