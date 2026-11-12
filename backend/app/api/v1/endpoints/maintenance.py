
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_organization, get_current_user_id, get_db
from app.models import Equipment, Maintenance, MaintenanceAlert, MaintenanceTypeModel
from app.schemas.maintenance import (
    MaintenanceAlertCreate,
    MaintenanceAlertResponse,
    MaintenanceAlertUpdate,
    MaintenanceCreate,
    MaintenanceResponse,
    MaintenanceTypeResponse,
    MaintenanceUpdate,
)

router = APIRouter()


@router.post("/types", response_model=MaintenanceTypeResponse)
async def create_maintenance_type(
    name: str,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(select(MaintenanceTypeModel).where(MaintenanceTypeModel.name == name))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance type with this name already exists",
        )

    maintenance_type = MaintenanceTypeModel(name=name)
    db.add(maintenance_type)
    await db.commit()
    await db.refresh(maintenance_type)

    return maintenance_type


@router.get("/types", response_model=list[MaintenanceTypeResponse])
async def list_maintenance_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MaintenanceTypeModel))
    types = result.scalars().all()
    return types


@router.get("/", response_model=list[MaintenanceResponse])
async def list_maintenance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    equipment_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    query = select(Maintenance).where(Maintenance.organization_id == current_org_id)

    if equipment_id is not None:
        query = query.where(Maintenance.equipment_id == equipment_id)

    query = query.order_by(Maintenance.performed_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    maintenance_list = result.scalars().all()

    return maintenance_list


@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance(
    maintenance_data: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
    current_user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Equipment.id).where(
            Equipment.id == maintenance_data.equipment_id,
            Equipment.organization_id == current_org_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    result = await db.execute(
        select(MaintenanceTypeModel.id).where(
            MaintenanceTypeModel.id == maintenance_data.maintenance_type_id
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance type not found",
        )

    maintenance = Maintenance(
        organization_id=current_org_id,
        **maintenance_data.model_dump(),
        performed_by=current_user_id,
    )
    db.add(maintenance)
    await db.commit()
    await db.refresh(maintenance)

    return maintenance


@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
async def get_maintenance(
    maintenance_id: int,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == maintenance_id,
            Maintenance.organization_id == current_org_id,
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance not found",
        )

    return maintenance


@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
async def update_maintenance(
    maintenance_id: int,
    maintenance_data: MaintenanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == maintenance_id,
            Maintenance.organization_id == current_org_id,
        )
    )
    maintenance = result.scalar_one_or_none()

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance not found",
        )

    update_data = maintenance_data.model_dump(exclude_unset=True)

    for required_field in ("equipment_id", "maintenance_type_id"):
        if required_field in update_data and update_data[required_field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{required_field} cannot be null",
            )

    if update_data.get("equipment_id") is not None:
        result = await db.execute(
            select(Equipment.id).where(
                Equipment.id == update_data["equipment_id"],
                Equipment.organization_id == current_org_id,
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipment not found",
            )

    if update_data.get("maintenance_type_id") is not None:
        result = await db.execute(
            select(MaintenanceTypeModel.id).where(
                MaintenanceTypeModel.id == update_data["maintenance_type_id"]
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Maintenance type not found",
            )

    for field, new_value in update_data.items():
        setattr(maintenance, field, new_value)

    await db.commit()
    await db.refresh(maintenance)

    return maintenance


@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance(
    maintenance_id: int,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Maintenance).where(
            Maintenance.id == maintenance_id,
            Maintenance.organization_id == current_org_id,
        )
    )
    maintenance = result.scalar_one_or_none()

    if maintenance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance not found",
        )

    await db.delete(maintenance)
    await db.commit()


@router.get("/alerts", response_model=list[MaintenanceAlertResponse])
async def list_maintenance_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    query = select(MaintenanceAlert).join(
        MaintenanceAlert.equipment
    ).where(
        MaintenanceAlert.equipment.has(organization_id=current_org_id)
    )

    if status:
        query = query.where(MaintenanceAlert.status == status)

    query = query.order_by(MaintenanceAlert.alert_date.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return alerts


@router.post("/alerts", response_model=MaintenanceAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_alert(
    alert_data: MaintenanceAlertCreate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Equipment.id).where(
            Equipment.id == alert_data.equipment_id,
            Equipment.organization_id == current_org_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    alert = MaintenanceAlert(**alert_data.model_dump())
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    return alert


@router.put("/alerts/{alert_id}", response_model=MaintenanceAlertResponse)
async def update_maintenance_alert(
    alert_id: int,
    alert_data: MaintenanceAlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(MaintenanceAlert).join(
            MaintenanceAlert.equipment
        ).where(
            MaintenanceAlert.id == alert_id,
            MaintenanceAlert.equipment.has(organization_id=current_org_id)
        )
    )
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance alert not found",
        )

    update_data = alert_data.model_dump(exclude_unset=True)

    for field, new_value in update_data.items():
        setattr(alert, field, new_value)

    await db.commit()
    await db.refresh(alert)

    return alert
