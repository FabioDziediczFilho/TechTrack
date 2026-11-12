from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MaintenanceType(str, Enum):
    PREVENTIVE = "preventive"
    CORRECTIVE = "corrective"


class MaintenanceTypeModel(Base):
    __tablename__ = "maintenance_types"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


class Maintenance(Base):
    __tablename__ = "maintenance"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id"), nullable=False, index=True)
    maintenance_type_id: Mapped[int] = mapped_column(ForeignKey("maintenance_types.id"), nullable=False)
    performed_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    parts_replaced: Mapped[str] = mapped_column(Text, nullable=True)
    cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    performed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", backref="maintenance")
    equipment = relationship("Equipment", backref="maintenance")
    maintenance_type = relationship("MaintenanceTypeModel", backref="maintenance")
    performer = relationship("User", backref="maintenance_performed")


class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id"), nullable=False, index=True)
    alert_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", backref="maintenance_alerts")
