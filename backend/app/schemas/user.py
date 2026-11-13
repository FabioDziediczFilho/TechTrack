from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.models.user import UserRole
from app.schemas.auth import UserResponse


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.USER

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Full name cannot be empty")
        return cleaned


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    role: UserRole | None = None
    is_active: bool | None = None

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Full name cannot be empty")
        return cleaned

    @model_validator(mode="after")
    def reject_null_values(self):
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("User fields cannot be null")
        return self


__all__ = ["UserCreate", "UserResponse", "UserUpdate"]
