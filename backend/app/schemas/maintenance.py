from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MaintenanceTypeResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class MaintenanceBase(BaseModel):
    equipment_id: int
    maintenance_type_id: int
    performed_by: int
    description: str | None = None
    parts_replaced: str | None = None
    cost: float | None = None
    performed_at: datetime


class MaintenanceCreate(BaseModel):
    equipment_id: int
    maintenance_type_id: int
    description: str | None = None
    parts_replaced: str | None = None
    cost: float | None = None
    performed_at: datetime


class MaintenanceUpdate(BaseModel):
    equipment_id: int | None = None
    maintenance_type_id: int | None = None
    description: str | None = None
    parts_replaced: str | None = None
    cost: float | None = None
    performed_at: datetime | None = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    organization_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)
