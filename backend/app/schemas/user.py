from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.group import GroupSummary

UserRole = Literal["viewer", "editor", "admin"]


class UserSummary(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool
    created_at: str
    groups: list[GroupSummary] = Field(default_factory=list)


class UserDetail(UserSummary):
    updated_at: str


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1)
    password: str = Field(min_length=8)
    role: UserRole
    is_active: bool = True
    group_ids: list[str] = Field(default_factory=list)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = Field(default=None, min_length=1)
    password: str | None = Field(default=None, min_length=8)
    role: UserRole | None = None
    is_active: bool | None = None
    group_ids: list[str] | None = None
