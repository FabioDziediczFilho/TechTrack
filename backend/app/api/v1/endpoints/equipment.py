from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_organization, get_current_user_id
from app.models import Equipment, EquipmentTypeModel, EquipmentHistory, User, Sector
from app.schemas.equipment import (
    EquipmentCreate,
    EquipmentResponse,
    EquipmentUpdate,
    EquipmentHistoryResponse,
    EquipmentTypeResponse,
    SectorResponse,
    SectorCreate,
)

router = APIRouter()


@router.post("/types", response_model=EquipmentTypeResponse)
async def create_equipment_type(
    name: str,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(select(EquipmentTypeModel).where(EquipmentTypeModel.name == name))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment type with this name already exists",
        )

    equipment_type = EquipmentTypeModel(name=name)
    db.add(equipment_type)
    await db.commit()
    await db.refresh(equipment_type)

    return equipment_type


@router.get("/types", response_model=list[EquipmentTypeResponse])
async def list_equipment_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EquipmentTypeModel))
    types = result.scalars().all()
    return types


@router.get("/", response_model=list[EquipmentResponse])
async def list_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    type_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    query = select(Equipment).where(Equipment.organization_id == current_org_id)

    if type_id:
        query = query.where(Equipment.type_id == type_id)

    if status:
        query = query.where(Equipment.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Equipment.asset_number.ilike(search_pattern),
                Equipment.serial_number.ilike(search_pattern),
                Equipment.brand.ilike(search_pattern),
                Equipment.model.ilike(search_pattern),
            )
        )

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    equipment_list = result.scalars().all()

    return equipment_list


@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    equipment_data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Equipment).where(
            Equipment.organization_id == current_org_id,
            Equipment.asset_number == equipment_data.asset_number,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this asset number already exists in your organization",
        )

    result = await db.execute(
        select(Equipment).where(
            Equipment.organization_id == current_org_id,
            Equipment.serial_number == equipment_data.serial_number,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this serial number already exists in your organization",
        )

    equipment = Equipment(
        organization_id=current_org_id,
        **equipment_data.model_dump(),
    )
    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)

    return equipment


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Equipment).where(
            Equipment.id == equipment_id,
            Equipment.organization_id == current_org_id,
        )
    )
    equipment = result.scalar_one_or_none()

    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    return equipment


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    equipment_data: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
    current_user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Equipment).where(
            Equipment.id == equipment_id,
            Equipment.organization_id == current_org_id,
        )
    )
    equipment = result.scalar_one_or_none()

    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    update_data = equipment_data.model_dump(exclude_unset=True)

    for field, new_value in update_data.items():
        old_value = getattr(equipment, field)
        if old_value != new_value:
            setattr(equipment, field, new_value)

            history = EquipmentHistory(
                equipment_id=equipment.id,
                changed_by=current_user_id,
                field_name=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
            )
            db.add(history)

    await db.commit()
    await db.refresh(equipment)

    # Eager load the type relationship
    result = await db.execute(
        select(Equipment)
        .options(selectinload(Equipment.type))
        .where(Equipment.id == equipment.id)
    )
    equipment = result.scalar_one()

    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Equipment).where(
            Equipment.id == equipment_id,
            Equipment.organization_id == current_org_id,
        )
    )
    equipment = result.scalar_one_or_none()

    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    await db.delete(equipment)
    await db.commit()


@router.get("/{equipment_id}/history", response_model=list[EquipmentHistoryResponse])
async def get_equipment_history(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Equipment).where(
            Equipment.id == equipment_id,
            Equipment.organization_id == current_org_id,
        )
    )
    equipment = result.scalar_one_or_none()

    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    result = await db.execute(
        select(EquipmentHistory)
        .where(EquipmentHistory.equipment_id == equipment_id)
        .order_by(EquipmentHistory.changed_at.desc())
    )
    history = result.scalars().all()

    return history


@router.get("/sectors", response_model=list[SectorResponse])
async def list_sectors(
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Sector).where(Sector.organization_id == current_org_id)
    )
    sectors = result.scalars().all()
    return sectors


@router.post("/sectors", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
async def create_sector(
    sector_data: SectorCreate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    sector = Sector(
        organization_id=current_org_id,
        name=sector_data.name,
        description=sector_data.description,
    )
    db.add(sector)
    await db.commit()
    await db.refresh(sector)
    return sector
