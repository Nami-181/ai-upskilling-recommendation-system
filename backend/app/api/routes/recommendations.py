"""Skill-gap analysis, learning paths (roadmap), recommendations, quizzes and feedback."""
from fastapi import APIRouter
from sqlalchemy import select

from ai_engine import analyze_gap, career_readiness, grade_quiz
from app.api.deps import CurrentUser, OptionalUser, SessionDep
from app.core.errors import AppError, not_found
from app.models import Feedback, QuizQuestion, Recommendation, Skill
from app.schemas import AnalyzeIn, FeedbackIn, GenerateIn, QuizSubmitIn, StatusIn
from app.services import paths
from app.services.catalog import get_catalog, resolve_role, resolve_skill
from app.services.students import ensure_profile, levels

router = APIRouter(tags=["recommendations"])


def _role_for(db, user, value):
    role = resolve_role(db, value) if value else (user.profile.target_role if user.profile else None)
    if role is None:
        raise AppError(422, "NO_TARGET_ROLE", "Choose a target career first." if not value
                       else f"Unknown career role: {value}")
    return role


@router.post("/analyze/skills")
def analyze_skills(body: AnalyzeIn, user: CurrentUser, db: SessionDep):
    """Skill-gap report for the target role. Uses the saved profile unless skills are sent."""
    ensure_profile(db, user)
    role = _role_for(db, user, body.target_role)
    lv = levels(db, user.id)
    if body.skills is not None:
        lv = {}
        for s in body.skills:
            skill = resolve_skill(db, str(s.get("skill_id") or s.get("name") or ""))
            level = s.get("level", s.get("current", 0))
            if skill is None or not isinstance(level, int) or not 0 <= level <= 5:
                raise AppError(422, "INVALID_SKILL", f"Invalid skill entry: {s}")
            lv[skill.id] = level
    cat = get_catalog(db)
    gap = analyze_gap(lv, cat.role_requirements(role.id), cat.prereq_map(), cat.skill_names())
    cats = dict(zip(cat.skills.skill_id, cat.skills.category))
    return {
        "target_role": role.title, "role_id": role.id, "readiness": gap["readiness"], "missing": gap["missing"],
        "skills": [{"skill_id": r["skill_id"], "name": r["name"], "category": cats.get(r["skill_id"], ""),
                    "current": r["current"], "required": r["required_level"], "weight": r["weight"],
                    "gap": r["gap"], "severity": r["severity"], "importance": r["importance"], "rank": r["rank"],
                    "unlocks": r["unlocks"]} for r in gap["rows"]],
        "strengths": gap["strengths"], "is_sample": False,
    }


@router.get("/analyze/careers")
def analyze_careers(user: CurrentUser, db: SessionDep):
    """Readiness for every career role (career explorer)."""
    return career_readiness(levels(db, user.id), get_catalog(db))


@router.post("/recommendations/generate")
def generate(body: GenerateIn, user: CurrentUser, db: SessionDep):
    ensure_profile(db, user)
    role = _role_for(db, user, body.target_role)
    if user.profile.target_role_id != role.id:
        user.profile.target_role_id = role.id
    path = paths.generate_path(db, user, role)
    return paths.path_out(db, path)


@router.get("/recommendations")
def get_recommendations(user: CurrentUser, db: SessionDep):
    return paths.path_out(db, paths.active_path(db, user.id))


@router.patch("/roadmap/modules/{module_id}")
def update_module(module_id: int, body: StatusIn, user: CurrentUser, db: SessionDep):
    m = paths.get_module(db, user, module_id)
    paths.set_module_status(db, user, m, body.status)
    db.commit()
    return paths.path_out(db, m.path)


@router.patch("/recommendations/{rec_id}")
def update_item(rec_id: int, body: StatusIn, user: CurrentUser, db: SessionDep):
    rec = db.get(Recommendation, rec_id)
    if rec is None or rec.user_id != user.id:
        raise not_found("Recommendation")
    rec.status = body.status
    if rec.module_id:
        m = paths.get_module(db, user, rec.module_id)
        db.flush()
        db.refresh(m)
        if body.status != "not_started" and m.status == "not_started":
            m.status = "in_progress"
    db.commit()
    return paths.path_out(db, paths.active_path(db, user.id))


@router.post("/recommendations/{rec_id}/save")
def toggle_saved(rec_id: int, user: CurrentUser, db: SessionDep):
    rec = db.get(Recommendation, rec_id)
    if rec is None or rec.user_id != user.id:
        raise not_found("Recommendation")
    rec.saved = not rec.saved
    db.commit()
    return {"id": rec.id, "saved": rec.saved}


# ---------------- quizzes ----------------
@router.get("/quizzes/{skill_id}")
def get_quiz(skill_id: str, user: CurrentUser, db: SessionDep):
    skill = db.get(Skill, skill_id)
    qs = db.scalars(select(QuizQuestion).where(QuizQuestion.skill_id == skill_id).order_by(QuizQuestion.id)).all()
    if skill is None or not qs:
        raise not_found("Quiz")
    return {"skill_id": skill.id, "skill_name": skill.name,
            "questions": [{"id": q.id, "question": q.question, "options": q.options} for q in qs]}


@router.post("/quizzes/{skill_id}/attempts")
def submit_quiz(skill_id: str, body: QuizSubmitIn, user: CurrentUser, db: SessionDep):
    qs = db.scalars(select(QuizQuestion).where(QuizQuestion.skill_id == skill_id).order_by(QuizQuestion.id)).all()
    if not qs:
        raise not_found("Quiz")
    unknown = set(body.answers) - {q.id for q in qs}
    if unknown:
        raise AppError(422, "INVALID_ANSWERS", f"Unknown question ids: {sorted(unknown)}")
    score = grade_quiz([q.answer_index for q in qs], [body.answers.get(q.id, -1) for q in qs])
    result = paths.apply_quiz(db, user, skill_id, score, body.answers)
    result["correct"] = {q.id: q.answer_index for q in qs}
    return result


# ---------------- feedback ----------------
@router.post("/feedback")
def feedback(body: FeedbackIn, db: SessionDep, user: OptionalUser):
    """Recommendation feedback (signed in) or a contact / support message (anyone)."""
    if user is None and body.type != "contact":
        raise AppError(401, "NOT_AUTHENTICATED", "Please sign in.")
    if body.type == "contact" and not (body.email or user):
        raise AppError(422, "EMAIL_REQUIRED", "Please enter your email so we can reply.")
    fb = Feedback(user_id=user.id if user else None, type=body.type, item_type=body.item_type or "",
                  item_id=str(body.item_id or ""), value=body.value or "", rating=body.rating,
                  comment=body.comment or body.message, name=body.name,
                  email=body.email or (user.email if user else ""), subject=body.subject)
    message = "Thanks, your feedback was saved." if body.type != "contact" else "Thanks, we will get back to you soon."
    if user is not None and body.type == "recommendation" and body.item_id is not None:
        rec = db.get(Recommendation, int(body.item_id)) if str(body.item_id).isdigit() else None
        if rec is None or rec.user_id != user.id:
            raise not_found("Recommendation")
        fb.item_type, fb.item_id = rec.item_type, rec.item_id
        db.add(fb)
        db.flush()
        if body.value:
            message = paths.apply_feedback(db, user, rec, body.value)
    else:
        db.add(fb)
    db.commit()
    return {"ok": True, "message": message}
