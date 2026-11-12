from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TicketBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    priority: str = "medium"
    equipment_id: int | None = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    assigned_to: int | None = None


class TicketResponse(TicketBase):
    id: int
    organization_id: int
    reported_by: int
    assigned_to: int | None
    status: str
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class TicketCommentBase(BaseModel):
    comment: str = Field(..., min_length=1)


class TicketCommentCreate(TicketCommentBase):
    pass


class TicketCommentResponse(TicketCommentBase):
    id: int
    ticket_id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
