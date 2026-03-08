from typing import Literal

from pydantic import BaseModel, Field

GroupStatus = Literal["active", "archived"]


class GroupSummary(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    status: GroupStatus = "active"
    member_count: int = 0
    created_at: str


class GroupDetail(GroupSummary):
    updated_at: str
    member_ids: list[str] = Field(default_factory=list)


class GroupCreate(BaseModel):
    name: str = Field(min_length=1)
    slug: str | None = None
    description: str = ""
    member_ids: list[str] = Field(default_factory=list)


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    slug: str | None = None
    description: str | None = None
    member_ids: list[str] | None = None
