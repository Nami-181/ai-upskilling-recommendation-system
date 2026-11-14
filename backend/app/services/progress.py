"""Progress analytics: completion, streak, study hours, quiz history, skill growth."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ai_engine.adaptive import is_inactive
from app.models import LearningPath, ProgressEvent, QuizAttempt, Skill, User, iso
from app.services.paths import active_path, module_progress


def _day(dt: datetime) -> date:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).date()


def streak(days: set[date], today: date) -> int:
    n, d = 0, today
    if d not in days:
        d -= timedelta(days=1)  # streak still alive if you studied yesterday
    while d in days:
        n += 1
        d -= timedelta(days=1)
    return n


def summary(db: Session, user: User) -> dict:
    today = datetime.now(timezone.utc).date()
    events = list(db.scalars(select(ProgressEvent).where(ProgressEvent.user_id == user.id)))
    quizzes = list(db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user.id).order_by(QuizAttempt.id)))
    active_days = {_day(e.created_at) for e in events} | {_day(q.created_at) for q in quizzes}

    daily = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        mins = sum(e.minutes for e in events if _day(e.created_at) == d)
        daily.append({"date": d.isoformat(), "hours": round(mins / 60, 2)})
    weekly = []
    for w in range(7, -1, -1):
        start = today - timedelta(days=today.weekday()) - timedelta(weeks=w)
        mins = sum(e.minutes for e in events if start <= _day(e.created_at) < start + timedelta(days=7))
        weekly.append({"week_start": start.isoformat(), "hours": round(mins / 60, 2)})

    path = active_path(db, user.id)
    modules = path.modules if path else []
    items = [i for m in modules for i in m.items]
    total_h = sum(m.hours for m in modules) or 1
    overall = round(sum(m.hours * module_progress(m) / 100 for m in modules) / total_h * 100) if modules else 0

    names = {s.id: s.name for s in db.scalars(select(Skill))}
    readiness_history = [{"date": _day(p.created_at).isoformat(), "readiness": p.readiness, "role_id": p.role_id}
                         for p in db.scalars(select(LearningPath).where(LearningPath.user_id == user.id)
                                             .order_by(LearningPath.id))]
    return {
        "overall": overall,
        "milestones_completed": sum(1 for m in modules if m.status == "completed"),
        "milestones_total": len(modules),
        "items_completed": sum(1 for i in items if i.status == "completed"),
        "items_total": len(items),
        "streak_days": streak(active_days, today),
        "study_hours_total": round(sum(e.minutes for e in events) / 60, 1),
        "daily_hours": daily,
        "weekly_hours": weekly,
        "quiz_history": [{"skill_id": q.skill_id, "skill_name": names.get(q.skill_id, q.skill_id), "score": q.score,
                          "action": q.action, "date": iso(q.created_at)} for q in quizzes],
        "quiz_average": round(sum(q.score for q in quizzes) / len(quizzes), 1) if quizzes else None,
        "skills_improved": len({q.skill_id for q in quizzes if q.score >= 80}),
        "readiness_history": readiness_history,
        "upcoming": [{"module_id": m.id, "skill_name": m.skill.name, "due_date": m.due_date.isoformat()
                      if m.due_date else None, "progress": module_progress(m)}
                     for m in modules if m.status != "completed"][:3],
        "inactive": is_inactive(user.last_active_at if not events else max(e.created_at for e in events)),
        "is_sample": False,
    }
