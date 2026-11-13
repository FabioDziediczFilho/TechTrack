from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_equipment: int
    total_tickets: int
    open_tickets: int
    closed_tickets: int
    equipment_with_issues: int
    pending_maintenance_alerts: int
    avg_resolution_time_days: float


class TicketsByPeriod(BaseModel):
    date: str
    count: int


class EquipmentByType(BaseModel):
    type_name: str
    count: int
