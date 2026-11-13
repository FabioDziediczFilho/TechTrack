from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_organization, get_db
from app.models import Equipment, EquipmentTypeModel, MaintenanceAlert, Ticket
from app.schemas.dashboard import (
    DashboardStats,
    EquipmentByType,
    TicketsByPeriod,
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

    result = await db.execute(
        select(func.count(MaintenanceAlert.id))
        .join(Equipment, MaintenanceAlert.equipment_id == Equipment.id)
        .where(
            Equipment.organization_id == current_org_id,
            MaintenanceAlert.status == "pending",
        )
    )
    pending_maintenance_alerts = result.scalar() or 0

    # Average resolution time (days)
    result = await db.execute(
        select(Ticket.created_at, Ticket.closed_at).where(
            and_(
                Ticket.organization_id == current_org_id,
                Ticket.status == "closed",
                Ticket.closed_at.isnot(None)
            )
        )
    )
    resolution_times = result.all()
    avg_resolution_time_days = (
        sum(
            (closed_at - created_at).total_seconds() / 86400
            for created_at, closed_at in resolution_times
            if closed_at is not None
        )
        / len(resolution_times)
        if resolution_times
        else 0.0
    )

    return DashboardStats(
        total_equipment=total_equipment,
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        closed_tickets=closed_tickets,
        equipment_with_issues=equipment_with_issues,
        pending_maintenance_alerts=pending_maintenance_alerts,
        avg_resolution_time_days=avg_resolution_time_days,
    )


@router.get("/tickets-by-period", response_model=list[TicketsByPeriod])
async def get_tickets_by_period(
    days: int = Query(30, ge=1, le=365),
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


@router.get("/equipment-by-type", response_model=list[EquipmentByType])
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
