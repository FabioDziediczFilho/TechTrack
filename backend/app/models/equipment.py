from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EquipmentType(str, Enum):
    COMPUTER = "computer"
    NOTEBOOK = "notebook"
    PRINTER = "printer"
    SERVER = "server"


class EquipmentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class EquipmentTypeModel(Base):
    __tablename__ = "equipment_types"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    type_id: Mapped[int] = mapped_column(ForeignKey("equipment_types.id"), nullable=False)
    asset_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    processor: Mapped[str] = mapped_column(String(100), nullable=True)
    memory: Mapped[str] = mapped_column(String(50), nullable=True)
    storage: Mapped[str] = mapped_column(String(50), nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=EquipmentStatus.ACTIVE, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    type = relationship("EquipmentTypeModel", backref="equipment")
    organization = relationship("Organization", backref="equipment")


class EquipmentHistory(Base):
    __tablename__ = "equipment_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id"), nullable=False, index=True)
    changed_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str] = mapped_column(String(500), nullable=True)
    new_value: Mapped[str] = mapped_column(String(500), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", backref="history")
    user = relationship("User", backref="equipment_changes")
