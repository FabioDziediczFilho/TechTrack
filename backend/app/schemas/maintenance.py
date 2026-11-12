from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MaintenanceTypeBase(BaseModel):
    name: str


class MaintenanceTypeCreate(MaintenanceTypeBase):
    pass


class MaintenanceTypeResponse(MaintenanceTypeBase):
    id: int

    class Config:
        from_attributes = True


class MaintenanceBase(BaseModel):
    equipment_id: int
    maintenance_type_id: int
    performed_by: int
    description: Optional[str] = None
    parts_replaced: Optional[str] = None
    cost: Optional[float] = None
    performed_at: datetime


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    description: Optional[str] = None
    parts_replaced: Optional[str] = None
    cost: Optional[float] = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenanceAlertBase(BaseModel):
    equipment_id: int
    alert_date: datetime


class MaintenanceAlertCreate(MaintenanceAlertBase):
    pass


class MaintenanceAlertUpdate(BaseModel):
    status: str


class MaintenanceAlertResponse(MaintenanceAlertBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
