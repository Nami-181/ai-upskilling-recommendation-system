"""Student progress, notifications and achievements."""
from fastapi import APIRouter
from sqlalchemy import select, update

from ai_engine.adaptive import INACTIVE_DAYS
from app.api.deps import CurrentUser, SessionDep
from app.core.errors import AppError, not_found
from app.models import AdaptationLog, ProgressEvent, Recommendation, iso
from app.schemas import ProgressIn
from app.services import paths
from app.services.progress import summary

router = APIRouter(tags=["progress"])


@router.get("/progress")
def get_progress(user: CurrentUser, db: SessionDep):
    return summary(db, user)


@router.post("/progress")
def post_progress(body: ProgressIn, user: CurrentUser, db: SessionDep):
    """Log study minutes and/or change the status of a roadmap item or module."""
    if body.item_type != "study" and body.status is None:
        raise AppError(422, "STATUS_REQUIRED", "status is required for roadmap items and modules.")
    if body.item_type == "study" and body.minutes == 0:
        raise AppError(422, "MINUTES_REQUIRED", "Log at least one minute of study.")
    if body.item_type == "recommendation":
        rec = db.get(Recommendation, int(body.item_id)) if str(body.item_id).isdigit() else None
        if rec is None or rec.user_id != user.id:
            raise not_found("Recommendation")
        rec.status = body.status
        if rec.module_id:
            m = paths.get_module(db, user, rec.module_id)
            if m.status == "not_started" and body.status != "not_started":
                m.status = "in_progress"
    elif body.item_type == "module":
        m = paths.get_module(db, user, int(body.item_id)) if str(body.item_id).isdigit() else None
        if m is None:
            raise not_found("Roadmap step")
        paths.set_module_status(db, user, m, body.status)
    db.add(ProgressEvent(user_id=user.id, item_type=body.item_type, item_id=str(body.item_id),
                         status=body.status or "", minutes=body.minutes))
    db.commit()
    return summary(db, user)


@router.get("/notifications")
def notifications(user: CurrentUser, db: SessionDep):
    rows = db.scalars(select(AdaptationLog).where(AdaptationLog.user_id == user.id)
                      .order_by(AdaptationLog.id.desc()).limit(50)).all()
    items = [{"id": r.id, "title": r.title, "body": r.detail, "action": r.action, "unread": not r.is_read,
              "time": iso(r.created_at)} for r in rows]
    prog = summary(db, user)
    if prog["inactive"]:
        items.insert(0, {"id": 0, "title": "We miss you", "action": "nudge", "unread": True, "time": None,
                         "body": f"No study logged for over {INACTIVE_DAYS} days. Even 20 minutes today keeps "
                                 "your roadmap on track."})
    return items


@router.post("/notifications/read")
def mark_read(user: CurrentUser, db: SessionDep):
    db.execute(update(AdaptationLog).where(AdaptationLog.user_id == user.id).values(is_read=True))
    db.commit()
    return {"ok": True}


@router.get("/achievements")
def achievements(user: CurrentUser, db: SessionDep):
    p = summary(db, user)
    path = paths.active_path(db, user.id)
    passed = [q for q in p["quiz_history"] if q["score"] >= 80]
    badges = [
        ("first-roadmap", "Pathfinder", "Generated your first roadmap", path is not None),
        ("first-step", "First step", "Completed a roadmap item", p["items_completed"] >= 1),
        ("milestone", "Milestone", "Completed a whole skill module", p["milestones_completed"] >= 1),
        ("quiz-pass", "Quiz ace", "Scored 80% or more on a quiz", bool(passed)),
        ("three-skills", "Triple threat", "Passed quizzes in three skills", len({q["skill_id"] for q in passed}) >= 3),
        ("streak-3", "On a roll", "Studied three days in a row", p["streak_days"] >= 3),
        ("streak-7", "Week strong", "Studied seven days in a row", p["streak_days"] >= 7),
        ("ten-hours", "Ten hours", "Logged ten hours of study", p["study_hours_total"] >= 10),
        ("halfway", "Halfway there", "Reached 50% of your roadmap", p["overall"] >= 50),
        ("finished", "Role ready", "Completed your whole roadmap",
         bool(p["milestones_total"]) and p["milestones_completed"] == p["milestones_total"]),
    ]
    return [{"id": i, "title": t, "description": d, "earned": e} for i, t, d, e in badges]
