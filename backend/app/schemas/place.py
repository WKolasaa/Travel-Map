from typing import Literal

from pydantic import BaseModel, Field, model_validator

Visibility = Literal["public", "authenticated", "group", "admin_only"]
ContentStatus = Literal["draft", "published", "hidden", "archived"]


class PlaceSummary(BaseModel):
    id: str
    title: str
    slug: str
    city: str
    country: str
    latitude: float
    longitude: float
    summary: str
    trip_id: str | None = None
    marker_color: str
    image_url: str
    tags: list[str]
    visibility: Visibility
    group_ids: list[str] = Field(default_factory=list)
    start_date: str
    end_date: str
    status: ContentStatus


class PlaceDetail(PlaceSummary):
    description: str
    gallery: list[str]
    companions: list[str]
    rating: int
    trip_order: int


class PlaceCreate(BaseModel):
    title: str = Field(min_length=1)
    slug: str | None = None
    summary: str = Field(min_length=1)
    description: str = Field(min_length=1)
    city: str = Field(min_length=1)
    country: str = Field(min_length=1)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    start_date: str = Field(min_length=1)
    end_date: str = Field(min_length=1)
    marker_color: str = "#7dd8c6"
    trip_id: str | None = None
    image_url: str = Field(min_length=1)
    gallery: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    visibility: Visibility = "public"
    group_ids: list[str] = Field(default_factory=list)
    companions: list[str] = Field(default_factory=list)
    rating: int = Field(default=0, ge=0, le=5)
    trip_order: int = Field(default=0, ge=0)
    status: ContentStatus = "published"

    @model_validator(mode="after")
    def validate_dates(self) -> "PlaceCreate":
        if self.start_date > self.end_date:
            raise ValueError("Start date cannot be after end date")
        if self.trip_id is None and self.trip_order != 0:
            raise ValueError("Trip order must be 0 when the place is not assigned to a trip")
        if self.visibility == "group" and len(self.group_ids) == 0:
            raise ValueError("Group visibility requires at least one group")
        if self.visibility != "group" and len(self.group_ids) > 0:
            self.group_ids = []
        return self


class PlaceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    slug: str | None = None
    summary: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, min_length=1)
    city: str | None = Field(default=None, min_length=1)
    country: str | None = Field(default=None, min_length=1)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    start_date: str | None = Field(default=None, min_length=1)
    end_date: str | None = Field(default=None, min_length=1)
    marker_color: str | None = None
    trip_id: str | None = None
    image_url: str | None = Field(default=None, min_length=1)
    gallery: list[str] | None = None
    tags: list[str] | None = None
    visibility: Visibility | None = None
    group_ids: list[str] | None = None
    companions: list[str] | None = None
    rating: int | None = Field(default=None, ge=0, le=5)
    trip_order: int | None = Field(default=None, ge=0)
    status: ContentStatus | None = None
