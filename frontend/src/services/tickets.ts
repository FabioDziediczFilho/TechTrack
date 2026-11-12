import api from './api'
import { Ticket, TicketComment } from '../types'

export const ticketService = {
  list: async (params?: { status?: string; priority?: string; assigned_to?: number; equipment_id?: number }) => {
    const response = await api.get<Ticket[]>('/api/v1/tickets/', { params })
    return response.data
  },

  create: async (data: Partial<Ticket>) => {
    const response = await api.post<Ticket>('/api/v1/tickets/', data)
    return response.data
  },

  get: async (id: number) => {
    const response = await api.get<Ticket>(`/api/v1/tickets/${id}`)
    return response.data
  },

  update: async (id: number, data: Partial<Ticket>) => {
    const response = await api.put<Ticket>(`/api/v1/tickets/${id}`, data)
    return response.data
  },

  addComment: async (ticketId: number, comment: string) => {
    const response = await api.post<TicketComment>(`/api/v1/tickets/${ticketId}/comments`, { comment })
    return response.data
  },

  getComments: async (ticketId: number) => {
    const response = await api.get<TicketComment[]>(`/api/v1/tickets/${ticketId}/comments`)
    return response.data
  },
}
