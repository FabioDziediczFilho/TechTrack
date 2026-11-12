from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_organization
from app.models import Equipment, Ticket, MaintenanceAlert, EquipmentTypeModel
from app.schemas.dashboard import (
    DashboardStats,
    TicketsByPeriod,
    EquipmentByType,
)

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    # Total equipment
    result = await db.execute(
        select(func.count(Equipment.id)).where(Equipment.organization_id == current_org_id)
    )
    total_equipment = result.scalar() or 0

    # Total tickets
    result = await db.execute(
        select(func.count(Ticket.id)).where(Ticket.organization_id == current_org_id)
    )
    total_tickets = result.scalar() or 0

    # Open tickets
    result = await db.execute(
        select(func.count(Ticket.id)).where(
            and_(
                Ticket.organization_id == current_org_id,
                Ticket.status.in_(["open", "in_progress", "waiting"])
            )
        )
    )
    open_tickets = result.scalar() or 0

    # Closed tickets
    result = await db.execute(
        select(func.count(Ticket.id)).where(
            and_(
                Ticket.organization_id == current_org_id,
                Ticket.status == "closed"
            )
        )
    )
    closed_tickets = result.scalar() or 0

    # Equipment with issues (in maintenance status)
    result = await db.execute(
        select(func.count(Equipment.id)).where(
            and_(
                Equipment.organization_id == current_org_id,
                Equipment.status == "maintenance"
            )
        )
    )
    equipment_with_issues = result.scalar() or 0

    # Average resolution time (days)
    result = await db.execute(
        select(
            func.avg(
                func.julianday(Ticket.closed_at) - func.julianday(Ticket.created_at)
            )
        ).where(
            and_(
                Ticket.organization_id == current_org_id,
                Ticket.status == "closed",
                Ticket.closed_at.isnot(None)
            )
        )
    )
    avg_resolution = result.scalar()
    avg_resolution_time_days = float(avg_resolution) if avg_resolution else 0.0

    return DashboardStats(
        total_equipment=total_equipment,
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        closed_tickets=closed_tickets,
        equipment_with_issues=equipment_with_issues,
        avg_resolution_time_days=avg_resolution_time_days,
    )


@router.get("/tickets-by-period", response_model=List[TicketsByPeriod])
async def get_tickets_by_period(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    start_date = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Ticket.created_at).label("date"),
            func.count(Ticket.id).label("count")
        )
        .where(
            and_(
                Ticket.organization_id == current_org_id,
                Ticket.created_at >= start_date
            )
        )
        .group_by(func.date(Ticket.created_at))
        .order_by(func.date(Ticket.created_at))
    )

    tickets_by_period = [
        TicketsByPeriod(date=str(row.date), count=row.count)
        for row in result
    ]

    return tickets_by_period


@router.get("/equipment-by-type", response_model=List[EquipmentByType])
async def get_equipment_by_type(
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(
            EquipmentTypeModel.name.label("type_name"),
            func.count(Equipment.id).label("count")
        )
        .join(Equipment, Equipment.type_id == EquipmentTypeModel.id)
        .where(Equipment.organization_id == current_org_id)
        .group_by(EquipmentTypeModel.name)
    )

    equipment_by_type = [
        EquipmentByType(type_name=row.type_name, count=row.count)
        for row in result
    ]

    return equipment_by_type
