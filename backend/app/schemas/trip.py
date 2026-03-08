from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.place import PlaceSummary, Visibility

ContentStatus = Literal["draft", "published", "hidden", "archived"]


class TripSummary(BaseModel):
    id: str
    title: str
    slug: str
    summary: str
    start_date: str
    end_date: str
    route_enabled: bool
    color: str
    cover_image_url: str
    tags: list[str]
    visibility: Visibility = "public"
    group_ids: list[str] = Field(default_factory=list)
    status: ContentStatus


class TripDetail(TripSummary):
    description: str
    places: list[PlaceSummary] = Field(default_factory=list)


class TripCreate(BaseModel):
    title: str = Field(min_length=1)
    slug: str | None = None
    summary: str = Field(min_length=1)
    description: str = Field(min_length=1)
    start_date: str = Field(min_length=1)
    end_date: str = Field(min_length=1)
    route_enabled: bool = True
    color: str = "#7dd8c6"
    cover_image_url: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)
    visibility: Visibility = "public"
    group_ids: list[str] = Field(default_factory=list)
    status: ContentStatus = "published"

    @model_validator(mode="after")
    def validate_dates(self) -> "TripCreate":
        if self.start_date > self.end_date:
            raise ValueError("Start date cannot be after end date")
        if self.visibility == "group" and len(self.group_ids) == 0:
            raise ValueError("Group visibility requires at least one group")
        if self.visibility != "group" and len(self.group_ids) > 0:
            self.group_ids = []
        return self


class TripUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    slug: str | None = None
    summary: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, min_length=1)
    start_date: str | None = Field(default=None, min_length=1)
    end_date: str | None = Field(default=None, min_length=1)
    route_enabled: bool | None = None
    color: str | None = None
    cover_image_url: str | None = Field(default=None, min_length=1)
    tags: list[str] | None = None
    visibility: Visibility | None = None
    group_ids: list[str] | None = None
    status: ContentStatus | None = None
