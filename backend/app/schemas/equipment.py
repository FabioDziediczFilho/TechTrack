from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class EquipmentTypeResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SectorResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class SectorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class EquipmentBase(BaseModel):
    type_id: int
    sector_id: Optional[int] = None
    asset_number: str = Field(..., min_length=1, max_length=100)
    serial_number: str = Field(..., min_length=1, max_length=100)
    brand: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    processor: Optional[str] = Field(None, max_length=100)
    memory: Optional[str] = Field(None, max_length=50)
    storage: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    status: str = "active"


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    type_id: Optional[int] = None
    sector_id: Optional[int] = None
    asset_number: Optional[str] = Field(None, max_length=100)
    serial_number: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    processor: Optional[str] = Field(None, max_length=100)
    memory: Optional[str] = Field(None, max_length=50)
    storage: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None


class EquipmentResponse(EquipmentBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    type_id: int

    class Config:
        from_attributes = True


class EquipmentHistoryResponse(BaseModel):
    id: int
    equipment_id: int
    changed_by: int
    field_name: str
    old_value: Optional[str]
    new_value: Optional[str]
    changed_at: datetime

    class Config:
        from_attributes = True
