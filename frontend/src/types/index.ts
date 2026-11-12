export interface User {
  id: number
  email: string
  full_name: string
  role: string
  organization_id: number
  is_active: boolean
  created_at: string
}

export interface EquipmentType {
  id: number
  name: string
}

export interface Equipment {
  id: number
  organization_id: number
  type_id: number
  asset_number: string
  serial_number: string
  brand: string
  model: string
  processor: string | null
  memory: string | null
  storage: string | null
  location: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: number
  organization_id: number
  equipment_id: number | null
  reported_by: number
  assigned_to: number | null
  title: string
  description: string | null
  priority: string
  status: string
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface TicketComment {
  id: number
  ticket_id: number
  user_id: number
  comment: string
  created_at: string
}

export interface MaintenanceType {
  id: number
  name: string
}

export interface Maintenance {
  id: number
  organization_id: number
  equipment_id: number
  maintenance_type_id: number
  performed_by: number
  description: string | null
  parts_replaced: string | null
  cost: number | null
  performed_at: string
  created_at: string
}

export interface MaintenanceAlert {
  id: number
  equipment_id: number
  alert_date: string
  status: string
  created_at: string
}

export interface DashboardStats {
  total_equipment: number
  total_tickets: number
  open_tickets: number
  closed_tickets: number
  equipment_with_issues: number
  avg_resolution_time_days: number
}

export interface TicketsByPeriod {
  date: string
  count: number
}

export interface EquipmentByType {
  type_name: string
  count: number
}
