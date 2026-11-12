
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_organization, get_current_user, get_db
from app.models import Equipment, Ticket, TicketComment, User
from app.schemas.ticket import (
    TicketCommentCreate,
    TicketCommentResponse,
    TicketCreate,
    TicketResponse,
    TicketUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[TicketResponse])
async def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: str | None = None,
    priority: str | None = None,
    assigned_to: int | None = None,
    equipment_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    query = select(Ticket).where(Ticket.organization_id == current_org_id)

    if status:
        query = query.where(Ticket.status == status)

    if priority:
        query = query.where(Ticket.priority == priority)

    if assigned_to is not None:
        query = query.where(Ticket.assigned_to == assigned_to)

    if equipment_id is not None:
        query = query.where(Ticket.equipment_id == equipment_id)

    query = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return tickets


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
    current_user: dict = Depends(get_current_user),
):
    if ticket_data.equipment_id is not None:
        result = await db.execute(
            select(Equipment.id).where(
                Equipment.id == ticket_data.equipment_id,
                Equipment.organization_id == current_org_id,
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Equipment not found",
            )

    ticket = Ticket(
        organization_id=current_org_id,
        reported_by=int(current_user["sub"]),
        **ticket_data.model_dump(),
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return ticket


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Ticket).where(
            Ticket.id == ticket_id,
            Ticket.organization_id == current_org_id,
        )
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    return ticket


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Ticket).where(
            Ticket.id == ticket_id,
            Ticket.organization_id == current_org_id,
        )
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    update_data = ticket_data.model_dump(exclude_unset=True)
    if update_data.get("assigned_to") is not None:
        result = await db.execute(
            select(User.id).where(
                User.id == update_data["assigned_to"],
                User.organization_id == current_org_id,
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found",
            )

    for field, new_value in update_data.items():
        setattr(ticket, field, new_value)

    await db.commit()
    await db.refresh(ticket)

    return ticket


@router.post("/{ticket_id}/comments", response_model=TicketCommentResponse, status_code=status.HTTP_201_CREATED)
async def add_ticket_comment(
    ticket_id: int,
    comment_data: TicketCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(Ticket).where(
            Ticket.id == ticket_id,
            Ticket.organization_id == current_org_id,
        )
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=int(current_user["sub"]),
        **comment_data.model_dump(),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return comment


@router.get("/{ticket_id}/comments", response_model=list[TicketCommentResponse])
async def get_ticket_comments(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_org_id: int = Depends(get_current_organization),
):
    result = await db.execute(
        select(Ticket).where(
            Ticket.id == ticket_id,
            Ticket.organization_id == current_org_id,
        )
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    result = await db.execute(
        select(TicketComment)
        .where(TicketComment.ticket_id == ticket_id)
        .order_by(TicketComment.created_at.asc())
    )
    comments = result.scalars().all()

    return comments
