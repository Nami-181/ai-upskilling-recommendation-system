"""Store learning paths and recommendations, and apply adaptive updates."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ai_engine import build_learning_path, feedback_replacement, quiz_decision
from ai_engine.adaptive import easier_resource
from ai_engine.planner import schedule
from app.core.errors import AppError
from app.models import (AdaptationLog, CareerRole, Certification, Feedback, LearningPath, PathModule, ProjectIdea,
                        QuizAttempt, Recommendation, Resource, User, iso)
from app.services.catalog import get_catalog
from app.services.students import levels as student_levels
from app.services.students import set_skill


def log(db: Session, user_id: int, action: str, title: str, detail: str = "") -> None:
    db.add(AdaptationLog(user_id=user_id, action=action, title=title, detail=detail))


def active_path(db: Session, user_id: int) -> LearningPath | None:
    return db.scalar(select(LearningPath).where(LearningPath.user_id == user_id, LearningPath.status == "active")
                     .order_by(LearningPath.id.desc()).limit(1))


def latest_quiz_scores(db: Session, user_id: int) -> dict[str, float]:
    out: dict[str, float] = {}
    for a in db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user_id).order_by(QuizAttempt.id)):
        out[a.skill_id] = a.score
    return out


def disliked_resources(db: Session, user_id: int) -> set[str]:
    rows = db.scalars(select(Feedback).where(Feedback.user_id == user_id, Feedback.item_type == "resource",
                                             Feedback.value.in_(["too_easy", "too_hard", "not_relevant"])))
    return {f.item_id for f in rows}


def generate_path(db: Session, user: User, role: CareerRole) -> LearningPath:
    prof = user.profile
    catalog = get_catalog(db)
    plan = build_learning_path(catalog, student_levels(db, user.id), role.id,
                               hours_per_week=prof.hours_per_week if prof else 8,
                               preferred_type=prof.preferred_type if prof else "any",
                               quiz_scores=latest_quiz_scores(db, user.id),
                               disliked=disliked_resources(db, user.id))
    for old in db.scalars(select(LearningPath).where(LearningPath.user_id == user.id,
                                                     LearningPath.status == "active")):
        old.status = "replaced"
    path = LearningPath(user_id=user.id, role_id=role.id, readiness=plan["readiness"],
                        total_hours=plan["total_hours"], hours_per_week=prof.hours_per_week if prof else 8,
                        est_finish=date.fromisoformat(plan["est_finish"]))
    db.add(path)
    db.flush()
    for m in plan["modules"]:
        mod = PathModule(path_id=path.id, skill_id=m["skill_id"], order_no=m["order_no"], week_no=m["week_no"],
                         hours=m["hours"], due_date=date.fromisoformat(m["due_date"]), reason=m["reason"],
                         importance=m["importance"], current_level=m["current_level"],
                         target_level=m["target_level"])
        db.add(mod)
        db.flush()
        for r in m["resources"]:
            db.add(Recommendation(user_id=user.id, path_id=path.id, module_id=mod.id, item_type="resource",
                                  item_id=r["resource_id"], score=r["score"], reason=r["reason"]))
        if m["project"]:
            db.add(Recommendation(user_id=user.id, path_id=path.id, module_id=mod.id, item_type="project",
                                  item_id=m["project"]["project_id"], score=1.0, reason=m["project"]["reason"]))
    for c in plan["certifications"]:
        db.add(Recommendation(user_id=user.id, path_id=path.id, item_type="certification", item_id=c["cert_id"],
                              score=c["score"], reason=c["reason"]))
    log(db, user.id, "generated", f"New roadmap for {role.title}",
        f"{len(plan['modules'])} skills, about {plan['total_hours']} hours, finish by {plan['est_finish']}. "
        f"Readiness {plan['readiness']}%.")
    db.commit()
    db.refresh(path)
    return path


def reschedule(db: Session, path: LearningPath, hours_per_week: int | None = None) -> None:
    mods = [{"id": m.id, "hours": m.hours, "status": m.status, "week_no": m.week_no,
             "due_date": m.due_date.isoformat() if m.due_date else None} for m in path.modules]
    finish = schedule(mods, hours_per_week or path.hours_per_week, date.today())
    by_id = {m.id: m for m in path.modules}
    for m in mods:
        by_id[m["id"]].week_no = m["week_no"]
        by_id[m["id"]].due_date = date.fromisoformat(m["due_date"]) if m["due_date"] else None
    path.est_finish = date.fromisoformat(finish)
    if hours_per_week:
        path.hours_per_week = hours_per_week


def _item_detail(db: Session, rec: Recommendation) -> dict:
    model = {"resource": Resource, "project": ProjectIdea, "certification": Certification}[rec.item_type]
    obj = db.get(model, rec.item_id)
    base = {"id": rec.id, "item_type": rec.item_type, "item_id": rec.item_id, "score": rec.score,
            "reason": rec.reason, "status": rec.status, "saved": rec.saved}
    if obj is None:
        return {**base, "title": "(removed from catalogue)"}
    if rec.item_type == "resource":
        base.update(title=obj.title, provider=obj.provider, url=obj.url, type=obj.type, level=obj.level,
                    duration_hrs=obj.duration_hrs, is_free=obj.is_free, rating=obj.rating, skill_id=obj.skill_id)
    elif rec.item_type == "project":
        base.update(title=obj.title, description=obj.description, level=obj.level, est_hours=obj.est_hours,
                    skill_id=obj.skill_id)
    else:
        base.update(title=obj.title, provider=obj.provider, url=obj.url, cost=obj.cost, is_free=obj.is_free,
                    level=obj.level)
    return base


def module_progress(m: PathModule) -> int:
    if m.status == "completed":
        return 100
    items = [i for i in m.items if i.item_type in ("resource", "project")]
    if not items:
        return 50 if m.status == "in_progress" else 0
    done = sum(1 for i in items if i.status == "completed") + 0.5 * sum(1 for i in items if i.status == "in_progress")
    return round(100 * done / len(items))


def path_out(db: Session, path: LearningPath | None) -> dict:
    if path is None:
        return {"path": None, "modules": [], "certifications": [], "items": [], "generated_at": None}
    modules = []
    for m in path.modules:
        items = [_item_detail(db, i) for i in m.items]
        modules.append({
            "id": m.id, "skill_id": m.skill_id, "skill_name": m.skill.name, "category": m.skill.category,
            "order_no": m.order_no, "week_no": m.week_no, "hours": m.hours,
            "due_date": m.due_date.isoformat() if m.due_date else None, "status": m.status, "reason": m.reason,
            "importance": m.importance, "current_level": m.current_level, "target_level": m.target_level,
            "progress": module_progress(m),
            "resources": [i for i in items if i["item_type"] == "resource"],
            "project": next((i for i in items if i["item_type"] == "project"), None),
        })
    certs = [_item_detail(db, r) for r in path.recommendations if r.item_type == "certification"]
    total_h = sum(m.hours for m in path.modules) or 1
    done_h = sum(m.hours * module_progress(m) / 100 for m in path.modules)
    return {
        "path": {"id": path.id, "role_id": path.role_id, "role_title": path.role.title, "readiness": path.readiness,
                 "total_hours": path.total_hours, "hours_per_week": path.hours_per_week,
                 "est_finish": path.est_finish.isoformat() if path.est_finish else None,
                 "progress": round(100 * done_h / total_h) if path.modules else 100,
                 "modules_completed": sum(1 for m in path.modules if m.status == "completed"),
                 "modules_total": len(path.modules)},
        "modules": modules,
        "certifications": certs,
        "items": [i for m in modules for i in m["resources"] + ([m["project"]] if m["project"] else [])] + certs,
        "generated_at": iso(path.created_at),
    }


def get_module(db: Session, user: User, module_id: int) -> PathModule:
    m = db.get(PathModule, module_id)
    if m is None or m.path.user_id != user.id:
        raise AppError(404, "NOT_FOUND", "Roadmap step not found.")
    return m


def set_module_status(db: Session, user: User, m: PathModule, status: str) -> None:
    m.status = status
    m.completed_at = datetime.now(timezone.utc) if status == "completed" else None
    if status == "completed":
        set_skill(db, user, m.skill_id, m.target_level, "course")
        log(db, user.id, "completed", f"Completed {m.skill.name}", "Later steps moved earlier.")
    reschedule(db, m.path)


def apply_quiz(db: Session, user: User, skill_id: str, score: float, answers: dict) -> dict:
    hpw = user.profile.hours_per_week if user.profile else 8
    decision = quiz_decision(score, hpw)
    db.add(QuizAttempt(user_id=user.id, skill_id=skill_id, score=score, answers=answers, action=decision["action"]))
    set_skill(db, user, skill_id, decision["new_level"], "quiz", force=True)
    messages = [decision["message"]]
    path = active_path(db, user.id)
    module = next((m for m in path.modules if m.skill_id == skill_id), None) if path else None
    if module and module.status != "completed":
        if decision["action"] == "complete":
            module.status, module.completed_at = "completed", datetime.now(timezone.utc)
            log(db, user.id, "completed", f"Passed the {module.skill.name} quiz ({score:.0f}%)",
                "Module completed and your later steps moved earlier.")
        elif decision["action"] == "remediate":
            catalog = get_catalog(db)
            used = {i.item_id for i in module.items if i.item_type == "resource"}
            easy = easier_resource(catalog.resources_for(skill_id), used)
            if easy:
                db.add(Recommendation(user_id=user.id, path_id=path.id, module_id=module.id, item_type="resource",
                                      item_id=easy["resource_id"], score=0.5,
                                      reason=f"Added after a {score:.0f}% quiz: easier material to rebuild the basics."))
                messages.append(f"Added an easier resource: {easy['title']}.")
            module.hours += decision["extra_hours"]
            module.status = "in_progress"
            log(db, user.id, "remediated", f"{module.skill.name}: extra practice added",
                f"Quiz {score:.0f}% < 50%. +{decision['extra_hours']} h and easier material.")
        else:
            module.status = "in_progress"
        db.flush()
        db.refresh(module)
        reschedule(db, path)
    db.commit()
    return {"score": score, "action": decision["action"], "new_level": decision["new_level"], "messages": messages}


def apply_feedback(db: Session, user: User, rec: Recommendation, value: str) -> str:
    if rec.item_type != "resource" or value == "helpful":
        return "Thanks, your feedback was saved."
    catalog = get_catalog(db)
    module = db.get(PathModule, rec.module_id) if rec.module_id else None
    current = catalog.resources[catalog.resources.resource_id == rec.item_id]
    if module is None or current.empty:
        return "Thanks, your feedback was saved."
    used = {i.item_id for i in module.items if i.item_type == "resource"}
    pref = user.profile.preferred_type if user.profile else "any"
    repl = feedback_replacement(catalog.resources_for(module.skill_id), current.iloc[0].to_dict(), value, used, pref)
    old_title = current.iloc[0]["title"]
    if repl:
        rec.item_id, rec.status, rec.score = repl["resource_id"], "not_started", float(repl["score"])
        rec.reason = f"Replaced '{old_title}' after your feedback ({value.replace('_', ' ')})."
        log(db, user.id, "replaced", f"Swapped a {module.skill.name} resource", rec.reason)
        msg = f"Replaced with: {repl['title']}."
    elif value == "not_relevant":
        db.delete(rec)
        log(db, user.id, "removed", f"Removed '{old_title}'", "Marked as not relevant.")
        msg = "Removed from your roadmap."
    else:
        msg = "Feedback saved; there is no alternative at that level yet."
    db.commit()
    return msg
