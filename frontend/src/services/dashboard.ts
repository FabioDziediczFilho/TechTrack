import api from './api'
import { DashboardStats, TicketsByPeriod, EquipmentByType } from '../types'

export const dashboardService = {
  getStats: async () => {
    const response = await api.get<DashboardStats>('/api/v1/dashboard/stats')
    return response.data
  },

  getTicketsByPeriod: async (days: number = 30) => {
    const response = await api.get<TicketsByPeriod[]>('/api/v1/dashboard/tickets-by-period', {
      params: { days },
    })
    return response.data
  },

  getEquipmentByType: async () => {
    const response = await api.get<EquipmentByType[]>('/api/v1/dashboard/equipment-by-type')
    return response.data
  },
}
