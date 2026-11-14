"""Career roles, skills and learning resources (read for everyone, write for admins)."""
import uuid
from typing import Literal

from fastapi import APIRouter, Query, Response
from sqlalchemy import func, or_, select

from ai_engine.taxonomy import taxonomy_tree
from app.api.deps import AdminUser, SessionDep
from app.core.errors import AppError, not_found
from app.models import CareerRole, Certification, ProjectIdea, Resource, RoleSkill, Skill
from app.schemas import (CertificationOut, ProjectIdeaOut, ResourceIn, ResourceOut, ResourceUpdate, RoleDetail,
                         RoleOut, SkillOut)
from app.services.catalog import get_catalog, invalidate

router = APIRouter(tags=["catalogue"])


@router.get("/roles", response_model=list[RoleOut])
def list_roles(db: SessionDep):
    return [{"id": r.id, "title": r.title, "description": r.description}
            for r in db.scalars(select(CareerRole).order_by(CareerRole.title))]


@router.get("/roles/{role_id}", response_model=RoleDetail)
def get_role(role_id: str, db: SessionDep):
    role = db.get(CareerRole, role_id)
    if role is None:
        raise not_found("Career role")
    reqs = db.execute(select(RoleSkill, Skill).join(Skill, Skill.id == RoleSkill.skill_id)
                      .where(RoleSkill.role_id == role_id).order_by(RoleSkill.weight.desc(), Skill.name))
    return {"id": role.id, "title": role.title, "description": role.description,
            "requirements": [{"skill_id": s.id, "name": s.name, "category": s.category, "weight": rs.weight,
                              "required_level": rs.required_level} for rs, s in reqs]}


@router.get("/skills", response_model=list[SkillOut])
def list_skills(db: SessionDep):
    return db.scalars(select(Skill).order_by(Skill.category, Skill.name)).all()


@router.get("/skills/taxonomy")
def skill_taxonomy(db: SessionDep):
    return taxonomy_tree(get_catalog(db))


# ---------------- resources ----------------
def _res_out(r: Resource, names: dict) -> dict:
    return {**{c: getattr(r, c) for c in ("id", "skill_id", "title", "provider", "url", "type", "level",
                                          "duration_hrs", "is_free", "rating")},
            "skill_name": names.get(r.skill_id, r.skill_id)}


def _names(db) -> dict:
    return dict(db.execute(select(Skill.id, Skill.name)).all())


@router.get("/resources")
def list_resources(db: SessionDep, skill: str | None = None, type: str | None = None,
                   level: int | None = Query(None, ge=1, le=3), free: bool | None = None,
                   q: str | None = Query(None, max_length=100),
                   sort: Literal["rating", "duration", "title"] = "rating",
                   page: int = Query(1, ge=1), size: int = Query(24, ge=1, le=100)):
    stmt = select(Resource)
    if skill:
        stmt = stmt.where(Resource.skill_id == skill)
    if type:
        stmt = stmt.where(Resource.type == type)
    if level:
        stmt = stmt.where(Resource.level == level)
    if free is not None:
        stmt = stmt.where(Resource.is_free == free)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Resource.title.ilike(like), Resource.provider.ilike(like)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    order = {"rating": Resource.rating.desc(), "duration": Resource.duration_hrs, "title": Resource.title}[sort]
    rows = db.scalars(stmt.order_by(order, Resource.id).offset((page - 1) * size).limit(size))
    names = _names(db)
    return {"items": [_res_out(r, names) for r in rows], "total": total, "page": page, "size": size}


@router.get("/resources/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: str, db: SessionDep):
    r = db.get(Resource, resource_id)
    if r is None:
        raise not_found("Resource")
    return _res_out(r, _names(db))


def _check_skill(db, skill_id: str):
    if db.get(Skill, skill_id) is None:
        raise AppError(422, "UNKNOWN_SKILL", f"Unknown skill: {skill_id}")


@router.post("/resources", response_model=ResourceOut, status_code=201)
def create_resource(body: ResourceIn, db: SessionDep, _: AdminUser):
    _check_skill(db, body.skill_id)
    r = Resource(id="r" + uuid.uuid4().hex[:9], **{**body.model_dump(), "url": str(body.url)})
    db.add(r)
    db.commit()
    invalidate()
    return _res_out(r, _names(db))


@router.put("/resources/{resource_id}", response_model=ResourceOut)
def update_resource(resource_id: str, body: ResourceUpdate, db: SessionDep, _: AdminUser):
    r = db.get(Resource, resource_id)
    if r is None:
        raise not_found("Resource")
    data = body.model_dump(exclude_unset=True, exclude_none=True)
    if "skill_id" in data:
        _check_skill(db, data["skill_id"])
    if "url" in data:
        data["url"] = str(data["url"])
    for k, v in data.items():
        setattr(r, k, v)
    db.commit()
    invalidate()
    return _res_out(r, _names(db))


@router.delete("/resources/{resource_id}", status_code=204)
def delete_resource(resource_id: str, db: SessionDep, _: AdminUser):
    r = db.get(Resource, resource_id)
    if r is None:
        raise not_found("Resource")
    db.delete(r)
    db.commit()
    invalidate()
    return Response(status_code=204)


# ---------------- project ideas & certifications ----------------
@router.get("/project-ideas", response_model=list[ProjectIdeaOut])
def list_project_ideas(db: SessionDep, skill: str | None = None, level: int | None = Query(None, ge=1, le=3)):
    stmt = select(ProjectIdea)
    if skill:
        stmt = stmt.where(ProjectIdea.skill_id == skill)
    if level:
        stmt = stmt.where(ProjectIdea.level == level)
    names = _names(db)
    return [{**ProjectIdeaOut.model_validate(p).model_dump(), "skill_name": names.get(p.skill_id, p.skill_id)}
            for p in db.scalars(stmt.order_by(ProjectIdea.level, ProjectIdea.title))]


@router.get("/certifications", response_model=list[CertificationOut])
def list_certifications(db: SessionDep, role: str | None = None, free: bool | None = None):
    stmt = select(Certification)
    if role:
        stmt = stmt.where(Certification.role_id == role)
    if free is not None:
        stmt = stmt.where(Certification.is_free == free)
    return db.scalars(stmt.order_by(Certification.level, Certification.title)).all()
