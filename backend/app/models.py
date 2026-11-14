"""Database tables (SQLAlchemy 2.0 ORM). See docs/database.md for the ER diagram."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import (JSON, Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Integer, String,
                        Text, UniqueConstraint)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime | None) -> str | None:
    """ISO 8601 with an explicit UTC offset (SQLite drops tzinfo; PostgreSQL keeps it)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


TS = DateTime(timezone=True)


# ───────────────────────── Users & authentication ─────────────────────────
class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('student', 'admin')", name="ck_users_role"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), default="")
    role: Mapped[str] = mapped_column(String(20), default="student")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow)
    last_active_at: Mapped[datetime] = mapped_column(TS, default=utcnow)

    profile: Mapped[StudentProfile] = relationship(back_populates="user", uselist=False,
                                                   cascade="all, delete-orphan")
    skills: Mapped[list[StudentSkill]] = relationship(cascade="all, delete-orphan")
    courses: Mapped[list[StudentCourse]] = relationship(cascade="all, delete-orphan",
                                                        order_by="StudentCourse.id")
    projects: Mapped[list[StudentProject]] = relationship(cascade="all, delete-orphan",
                                                          order_by="StudentProject.id")


class AuthToken(Base):
    """One-time tokens for email verification and password reset (only the hash is stored)."""
    __tablename__ = "auth_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    purpose: Mapped[str] = mapped_column(String(20))  # verify_email | reset_password
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(TS)
    used_at: Mapped[datetime | None] = mapped_column(TS, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow)


# ───────────────────────── Catalogue (seeded from ai_engine/data) ─────────────────────────
class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    synonyms: Mapped[str] = mapped_column(Text, default="")  # pipe-separated


class SkillPrereq(Base):
    __tablename__ = "skill_prereqs"

    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    prereq_skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)


class CareerRole(Base):
    __tablename__ = "career_roles"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")

    requirements: Mapped[list[RoleSkill]] = relationship(cascade="all, delete-orphan")


class RoleSkill(Base):
    __tablename__ = "role_skills"
    __table_args__ = (CheckConstraint("weight BETWEEN 1 AND 3", name="ck_role_skills_weight"),
                      CheckConstraint("required_level BETWEEN 1 AND 5", name="ck_role_skills_level"))

    role_id: Mapped[str] = mapped_column(ForeignKey("career_roles.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    weight: Mapped[int] = mapped_column(Integer)
    required_level: Mapped[int] = mapped_column(Integer)


class Resource(Base):
    """Learning resource: course, video, docs, article."""
    __tablename__ = "resources"
    __table_args__ = (CheckConstraint("level BETWEEN 1 AND 3", name="ck_resources_level"),
                      CheckConstraint("rating BETWEEN 0 AND 5", name="ck_resources_rating"))

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    provider: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(String(500))
    type: Mapped[str] = mapped_column(String(20))  # course | video | docs | article
    level: Mapped[int] = mapped_column(Integer)  # 1 beginner, 2 intermediate, 3 advanced
    duration_hrs: Mapped[float] = mapped_column(Float)
    is_free: Mapped[bool] = mapped_column(Boolean, default=True)
    rating: Mapped[float] = mapped_column(Float, default=0)


class ProjectIdea(Base):
    __tablename__ = "project_ideas"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    level: Mapped[int] = mapped_column(Integer)
    est_hours: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text, default="")


class Certification(Base):
    __tablename__ = "certifications"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("career_roles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    provider: Mapped[str] = mapped_column(String(120))
    cost: Mapped[str] = mapped_column(String(80), default="")
    url: Mapped[str] = mapped_column(String(500))
    is_free: Mapped[bool] = mapped_column(Boolean, default=False)
    level: Mapped[int] = mapped_column(Integer, default=1)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(Text)
    options: Mapped[list] = mapped_column(JSON)
    answer_index: Mapped[int] = mapped_column(Integer)


# ───────────────────────── Student profile ─────────────────────────
class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    program: Mapped[str] = mapped_column(String(150), default="")
    institution: Mapped[str] = mapped_column(String(150), default="")
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bio: Mapped[str] = mapped_column(Text, default="")
    target_role_id: Mapped[str | None] = mapped_column(ForeignKey("career_roles.id", ondelete="SET NULL"),
                                                       nullable=True)
    hours_per_week: Mapped[int] = mapped_column(Integer, default=8)
    preferred_type: Mapped[str] = mapped_column(String(20), default="any")
    interests: Mapped[list] = mapped_column(JSON, default=list)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(TS, default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="profile")
    target_role: Mapped[CareerRole | None] = relationship()


class StudentSkill(Base):
    __tablename__ = "student_skills"
    __table_args__ = (CheckConstraint("level BETWEEN 0 AND 5", name="ck_student_skills_level"),)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    level: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(20), default="self")  # self | course | project | quiz
    updated_at: Mapped[datetime] = mapped_column(TS, default=utcnow, onupdate=utcnow)

    skill: Mapped[Skill] = relationship()


class StudentCourse(Base):
    __tablename__ = "student_courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    provider: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[str] = mapped_column(String(20), default="completed")  # completed | in_progress
    completed_on: Mapped[date | None] = mapped_column(Date, nullable=True)


class StudentProject(Base):
    __tablename__ = "student_projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    tech_stack: Mapped[str] = mapped_column(String(300), default="")
    url: Mapped[str] = mapped_column(String(500), default="")


# ───────────────────────── Learning paths & recommendations ─────────────────────────
class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("career_roles.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | replaced
    readiness: Mapped[float] = mapped_column(Float, default=0)
    total_hours: Mapped[int] = mapped_column(Integer, default=0)
    hours_per_week: Mapped[int] = mapped_column(Integer, default=8)
    est_finish: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow)

    role: Mapped[CareerRole] = relationship()
    modules: Mapped[list[PathModule]] = relationship(cascade="all, delete-orphan", order_by="PathModule.order_no",
                                                     back_populates="path")
    recommendations: Mapped[list[Recommendation]] = relationship(cascade="all, delete-orphan",
                                                                 order_by="Recommendation.id")


class PathModule(Base):
    """One skill to learn inside a learning path (a roadmap milestone)."""
    __tablename__ = "path_modules"
    __table_args__ = (UniqueConstraint("path_id", "skill_id", name="uq_path_module_skill"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    path_id: Mapped[int] = mapped_column(ForeignKey("learning_paths.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    order_no: Mapped[int] = mapped_column(Integer)
    week_no: Mapped[int] = mapped_column(Integer, default=1)
    hours: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="not_started")  # not_started | in_progress | completed
    reason: Mapped[str] = mapped_column(Text, default="")
    importance: Mapped[float] = mapped_column(Float, default=0)
    current_level: Mapped[int] = mapped_column(Integer, default=0)
    target_level: Mapped[int] = mapped_column(Integer, default=1)
    completed_at: Mapped[datetime | None] = mapped_column(TS, nullable=True)

    path: Mapped[LearningPath] = relationship(back_populates="modules")
    skill: Mapped[Skill] = relationship()
    items: Mapped[list[Recommendation]] = relationship(order_by="Recommendation.id", viewonly=True)


class Recommendation(Base):
    """A recommended course/resource, project or certification, with its score and reason.

    Resources and projects belong to a module; certifications belong to the path only.
    """
    __tablename__ = "recommendations"
    __table_args__ = (CheckConstraint("item_type IN ('resource', 'project', 'certification')",
                                      name="ck_recommendations_type"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    path_id: Mapped[int] = mapped_column(ForeignKey("learning_paths.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[int | None] = mapped_column(ForeignKey("path_modules.id", ondelete="CASCADE"), nullable=True)
    item_type: Mapped[str] = mapped_column(String(20))
    item_id: Mapped[str] = mapped_column(String(20))  # resources.id / project_ideas.id / certifications.id
    score: Mapped[float] = mapped_column(Float, default=0)
    reason: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    saved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow)


# ───────────────────────── Progress, quizzes, feedback ─────────────────────────
class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (CheckConstraint("score BETWEEN 0 AND 100", name="ck_quiz_score"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    score: Mapped[float] = mapped_column(Float)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    action: Mapped[str] = mapped_column(String(20), default="")
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow)


class ProgressEvent(Base):
    """Study activity: logged minutes and status changes. Drives streaks and weekly hours."""
    __tablename__ = "progress_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    item_type: Mapped[str] = mapped_column(String(20))  # recommendation | module | study | quiz
    item_id: Mapped[str] = mapped_column(String(40), default="")
    status: Mapped[str] = mapped_column(String(20), default="")
    minutes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow, index=True)


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[str] = mapped_column(String(20), default="recommendation")  # recommendation | contact | general
    item_type: Mapped[str] = mapped_column(String(20), default="")
    item_id: Mapped[str] = mapped_column(String(40), default="")
    value: Mapped[str] = mapped_column(String(20), default="")  # too_easy | too_hard | not_relevant | helpful
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comment: Mapped[str] = mapped_column(Text, default="")
    name: Mapped[str] = mapped_column(String(120), default="")
    email: Mapped[str] = mapped_column(String(255), default="")
    subject: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow)


class AdaptationLog(Base):
    """Why recommendations changed. Shown to the student as notifications."""
    __tablename__ = "adaptation_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    action: Mapped[str] = mapped_column(String(30))  # generated | completed | remediated | replaced | removed
    title: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(Text, default="")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TS, default=utcnow)
