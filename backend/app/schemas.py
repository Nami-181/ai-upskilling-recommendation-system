"""Request / response schemas (Pydantic v2). These are the API's validation layer.

User and profile objects use camelCase because the React app stores them as-is;
all other payloads use snake_case, matching the contracts in frontend/src/services.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator
from pydantic.alias_generators import to_camel

ResourceType = Literal["course", "video", "docs", "article", "book"]
PreferredType = Literal["any", "course", "video", "docs", "article", "book"]
Status = Literal["not_started", "in_progress", "completed"]


def check_password(v: str) -> str:
    problems = []
    if len(v) < 8:
        problems.append("at least 8 characters")
    if not (re.search(r"[a-z]", v) and re.search(r"[A-Z]", v)):
        problems.append("upper and lowercase letters")
    if not re.search(r"\d", v):
        problems.append("a number")
    if problems:
        raise ValueError("Password needs " + ", ".join(problems) + ".")
    return v


class Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class Message(BaseModel):
    message: str
    demoToken: str | None = None  # only in DEMO_MODE without SMTP


# ───────── Auth ─────────
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(max_length=128)

    _pw = field_validator("password")(check_password)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("Please enter your name.")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class EmailIn(BaseModel):
    email: EmailStr


class VerifyEmailIn(BaseModel):
    email: EmailStr
    token: str = Field(min_length=10, max_length=200)


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    password: str = Field(max_length=128)

    _pw = field_validator("password")(check_password)


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(max_length=128)

    _pw = field_validator("new_password")(check_password)


class UserOut(Camel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    verified: bool
    onboarding_complete: bool
    profile_completion: int
    target_role: str | None = None
    target_role_id: str | None = None
    program: str = ""
    year: int | None = None
    weekly_hours_goal: int = 8
    created_at: datetime | None = None


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterOut(BaseModel):
    user: UserOut
    message: str
    demoToken: str | None = None


# ───────── Profile ─────────
class SkillLevelIn(BaseModel):
    skill_id: str = Field(min_length=1, max_length=50)
    level: int = Field(ge=0, le=5)


class SkillLevelOut(Camel):
    skill_id: str
    name: str
    category: str
    level: int
    source: str


class CourseIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    provider: str = Field(default="", max_length=120)
    status: Literal["completed", "in_progress"] = "completed"
    completed_on: date | None = None


class CourseOut(Camel, CourseIn):
    id: int


class ProjectIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=3000)
    tech_stack: str = Field(default="", max_length=300)
    url: str = Field(default="", max_length=500)

    @field_validator("url")
    @classmethod
    def valid_url(cls, v: str) -> str:
        if v:
            HttpUrl(v)
        return v


class ProjectOut(Camel, ProjectIn):
    id: int


class ProfileUpdate(BaseModel):
    """PUT /profile. Every field is optional; camelCase or snake_case keys are accepted."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    program: str | None = Field(default=None, max_length=150)
    institution: str | None = Field(default=None, max_length=150)
    year: int | None = Field(default=None, ge=1, le=6)
    bio: str | None = Field(default=None, max_length=2000)
    target_role_id: str | None = Field(default=None, max_length=80)
    weekly_hours_goal: int | None = Field(default=None, ge=1, le=60)
    preferred_resource_type: PreferredType | None = None
    interests: list[str] | None = Field(default=None, max_length=20)
    onboarding_complete: bool | None = None
    skills: list[SkillLevelIn] | None = Field(default=None, max_length=60)
    courses: list[CourseIn] | None = Field(default=None, max_length=50)
    projects: list[ProjectIn] | None = Field(default=None, max_length=50)


class ProfileOut(UserOut):
    institution: str = ""
    bio: str = ""
    preferred_resource_type: str = "any"
    interests: list[str] = []
    skills: list[SkillLevelOut] = []
    courses: list[CourseOut] = []
    projects: list[ProjectOut] = []


# ───────── Catalogue ─────────
class RoleOut(BaseModel):
    id: str
    title: str
    description: str = ""


class RoleDetail(RoleOut):
    requirements: list[dict]


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    category: str


class ResourceIn(BaseModel):
    skill_id: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=2, max_length=200)
    provider: str = Field(min_length=1, max_length=120)
    url: HttpUrl
    type: ResourceType
    level: int = Field(ge=1, le=3)
    duration_hrs: float = Field(gt=0, le=500)
    is_free: bool = True
    rating: float = Field(default=4.0, ge=0, le=5)


class ResourceUpdate(BaseModel):
    skill_id: str | None = None
    title: str | None = Field(default=None, min_length=2, max_length=200)
    provider: str | None = Field(default=None, max_length=120)
    url: HttpUrl | None = None
    type: ResourceType | None = None
    level: int | None = Field(default=None, ge=1, le=3)
    duration_hrs: float | None = Field(default=None, gt=0, le=500)
    is_free: bool | None = None
    rating: float | None = Field(default=None, ge=0, le=5)


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    skill_id: str
    skill_name: str = ""
    title: str
    provider: str
    url: str
    type: str
    level: int
    duration_hrs: float
    is_free: bool
    rating: float


class ProjectIdeaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    skill_id: str
    skill_name: str = ""
    title: str
    level: int
    est_hours: int
    description: str


class CertificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role_id: str
    title: str
    provider: str
    cost: str
    url: str
    is_free: bool
    level: int


# ───────── Analysis & recommendations ─────────
class AnalyzeIn(BaseModel):
    target_role: str | None = Field(default=None, max_length=120, description="role id or title; default: profile")
    skills: list[dict] | None = Field(default=None, description="[{name|skill_id, level}] ; default: profile")


class GenerateIn(BaseModel):
    target_role: str | None = Field(default=None, max_length=120)


class StatusIn(BaseModel):
    status: Status


class ProgressIn(BaseModel):
    item_id: str | int = ""
    item_type: Literal["recommendation", "module", "study"] = "study"
    status: Status | None = None
    minutes: int = Field(default=0, ge=0, le=600)


class QuizSubmitIn(BaseModel):
    answers: dict[str, int] = Field(description="{question_id: chosen option index}")


class FeedbackIn(BaseModel):
    type: Literal["recommendation", "contact", "general"] = "recommendation"
    item_id: str | int | None = None
    item_type: str | None = Field(default=None, max_length=20)
    value: Literal["too_easy", "too_hard", "not_relevant", "helpful"] | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str = Field(default="", max_length=3000)
    name: str = Field(default="", max_length=120)
    email: EmailStr | None = None
    subject: str = Field(default="", max_length=200)
    message: str = Field(default="", max_length=5000)
