from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EquipmentTypeResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class SectorResponse(BaseModel):
    id: int
    name: str
    description: str | None
    address: str | None
    responsible: str | None

    model_config = ConfigDict(from_attributes=True)


class SectorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    responsible: str | None = Field(None, max_length=255)


class SectorUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    responsible: str | None = Field(None, max_length=255)

    @field_validator("name")
    @classmethod
    def name_cannot_be_null(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("Department name cannot be null")
        return value


class EquipmentBase(BaseModel):
    type_id: int
    sector_id: int | None = None
    asset_number: str | None = Field(None, max_length=100)
    brand: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    processor: str | None = Field(None, max_length=100)
    memory: str | None = Field(None, max_length=50)
    storage: str | None = Field(None, max_length=50)
    observation: str | None = Field(None, max_length=2000)
    status: str = "active"

    @field_validator(
        "asset_number",
        "brand",
        "model",
        "processor",
        "memory",
        "storage",
        "observation",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            return value.strip() or None
        return value


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    type_id: int | None = None
    sector_id: int | None = None
    asset_number: str | None = Field(None, max_length=100)
    brand: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    processor: str | None = Field(None, max_length=100)
    memory: str | None = Field(None, max_length=50)
    storage: str | None = Field(None, max_length=50)
    observation: str | None = Field(None, max_length=2000)
    status: str | None = None


class EquipmentResponse(EquipmentBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime
    type_id: int

    model_config = ConfigDict(from_attributes=True)


class EquipmentHistoryResponse(BaseModel):
    id: int
    equipment_id: int
    changed_by: int
    field_name: str
    old_value: str | None
    new_value: str | None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)
