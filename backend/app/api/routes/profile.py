"""Student profile: details, skills, courses and projects."""
from fastapi import APIRouter, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy import delete, inspect, select

from app.api.deps import CurrentUser, SessionDep
from app.core.errors import AppError, not_found
from app.models import (AdaptationLog, Feedback, LearningPath, ProgressEvent, QuizAttempt, Recommendation,
                        StudentCourse, StudentProject, StudentSkill, utcnow)
from app.schemas import CourseIn, CourseOut, ProfileOut, ProfileUpdate, ProjectIn, ProjectOut, SkillLevelIn
from app.services.catalog import resolve_role, resolve_skill
from app.services.paths import active_path, path_out
from app.services.students import ensure_profile, infer_skills_from_history, profile_out

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut, response_model_by_alias=True)
def get_profile(user: CurrentUser, db: SessionDep):
    ensure_profile(db, user)
    return profile_out(user)


def _replace_skills(db, user, skills: list[SkillLevelIn]):
    seen = {}
    for s in skills:
        skill = resolve_skill(db, s.skill_id)
        if skill is None:
            raise AppError(422, "UNKNOWN_SKILL", f"Unknown skill: {s.skill_id}")
        seen[skill.id] = s.level
    db.execute(delete(StudentSkill).where(StudentSkill.user_id == user.id, StudentSkill.source == "self"))
    db.flush()
    for sid, level in seen.items():
        row = db.get(StudentSkill, (user.id, sid))
        if row is None:
            db.add(StudentSkill(user_id=user.id, skill_id=sid, level=level, source="self"))
        else:
            row.level, row.source = level, "self"
    db.flush()


@router.put("", response_model=ProfileOut, response_model_by_alias=True)
def update_profile(body: ProfileUpdate, user: CurrentUser, db: SessionDep):
    prof = ensure_profile(db, user)
    data = body.model_dump(exclude_unset=True)
    if "first_name" in data:
        user.first_name = data["first_name"].strip()
    if "last_name" in data:
        user.last_name = (data["last_name"] or "").strip()
    simple = {"program": "program", "institution": "institution", "year": "year", "bio": "bio",
              "weekly_hours_goal": "hours_per_week", "preferred_resource_type": "preferred_type",
              "interests": "interests", "onboarding_complete": "onboarding_complete"}
    for key, attr in simple.items():
        if key in data and data[key] is not None:
            setattr(prof, attr, data[key])
    if "target_role_id" in data:
        if data["target_role_id"]:
            role = resolve_role(db, data["target_role_id"])
            if role is None:
                raise AppError(422, "UNKNOWN_ROLE", f"Unknown career role: {data['target_role_id']}")
            prof.target_role_id = role.id
        else:
            prof.target_role_id = None
    if body.skills is not None:
        _replace_skills(db, user, body.skills)
    if body.courses is not None:
        user.courses = [StudentCourse(user_id=user.id, **c.model_dump()) for c in body.courses]
    if body.projects is not None:
        user.projects = [StudentProject(user_id=user.id, **p.model_dump()) for p in body.projects]
    db.flush()
    if body.courses is not None or body.projects is not None:
        infer_skills_from_history(db, user)
    db.commit()
    db.refresh(user)
    return profile_out(user)


@router.delete("", status_code=204)
def delete_account(user: CurrentUser, db: SessionDep):
    """Delete the account and all personal data."""
    db.delete(user)
    db.commit()
    return Response(status_code=204)


# ---- skills ----
@router.put("/skills", response_model=ProfileOut, response_model_by_alias=True)
def set_skills(skills: list[SkillLevelIn], user: CurrentUser, db: SessionDep):
    ensure_profile(db, user)
    _replace_skills(db, user, skills)
    db.commit()
    db.refresh(user)
    return profile_out(user)


# ---- courses ----
@router.post("/courses", response_model=CourseOut, status_code=201, response_model_by_alias=True)
def add_course(body: CourseIn, user: CurrentUser, db: SessionDep):
    c = StudentCourse(user_id=user.id, **body.model_dump())
    db.add(c)
    db.flush()
    db.refresh(user)
    infer_skills_from_history(db, user)
    db.commit()
    return c


@router.delete("/courses/{course_id}", status_code=204)
def delete_course(course_id: int, user: CurrentUser, db: SessionDep):
    c = db.get(StudentCourse, course_id)
    if c is None or c.user_id != user.id:
        raise not_found("Course")
    db.delete(c)
    db.commit()
    return Response(status_code=204)


# ---- projects ----
@router.post("/projects", response_model=ProjectOut, status_code=201, response_model_by_alias=True)
def add_project(body: ProjectIn, user: CurrentUser, db: SessionDep):
    p = StudentProject(user_id=user.id, **body.model_dump())
    db.add(p)
    db.flush()
    db.refresh(user)
    infer_skills_from_history(db, user)
    db.commit()
    return p


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: int, user: CurrentUser, db: SessionDep):
    p = db.get(StudentProject, project_id)
    if p is None or p.user_id != user.id:
        raise not_found("Project")
    db.delete(p)
    db.commit()
    return Response(status_code=204)


def _rows(db, model, user_id: int) -> list[dict]:
    cols = [c.key for c in inspect(model).mapper.column_attrs]
    out = []
    for obj in db.scalars(select(model).where(model.user_id == user_id).order_by(model.id)):
        out.append({k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in
                    ((k, getattr(obj, k)) for k in cols)})
    return out


@router.get("/export")
def export_data(user: CurrentUser, db: SessionDep):
    """NFR-015: download everything stored about the signed-in student as JSON."""
    ensure_profile(db, user)
    data = {
        "exported_at": utcnow().isoformat(),
        "profile": profile_out(user),
        "active_learning_path": path_out(db, active_path(db, user.id)),
        **{name: _rows(db, model, user.id) for name, model in [
            ("learning_paths", LearningPath), ("recommendations", Recommendation), ("quiz_attempts", QuizAttempt),
            ("progress_events", ProgressEvent), ("feedback", Feedback), ("adaptation_log", AdaptationLog)]},
    }
    return JSONResponse(jsonable_encoder(data),
                        headers={"Content-Disposition": f'attachment; filename="lumora-data-{user.id}.json"'})
