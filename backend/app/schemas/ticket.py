from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TicketBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: str = "medium"
    equipment_id: Optional[int] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None


class TicketResponse(TicketBase):
    id: int
    organization_id: int
    reported_by: int
    assigned_to: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TicketCommentBase(BaseModel):
    comment: str = Field(..., min_length=1)


class TicketCommentCreate(TicketCommentBase):
    pass


class TicketCommentResponse(TicketCommentBase):
    id: int
    ticket_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
