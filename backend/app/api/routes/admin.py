"""Admin: platform statistics and user management."""
from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import AdminUser, SessionDep
from app.core.errors import AppError, not_found
from app.models import Feedback, LearningPath, QuizAttempt, Resource, User, iso
from app.services.students import user_out

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(db: SessionDep, _: AdminUser):
    count = lambda m: db.scalar(select(func.count()).select_from(m))  # noqa: E731
    return {"users": count(User), "learning_paths": count(LearningPath), "quiz_attempts": count(QuizAttempt),
            "resources": count(Resource), "feedback": count(Feedback),
            "avg_quiz_score": round(db.scalar(select(func.avg(QuizAttempt.score))) or 0, 1)}


@router.get("/users")
def users(db: SessionDep, _: AdminUser):
    return [user_out(u) for u in db.scalars(select(User).order_by(User.id))]


@router.patch("/users/{user_id}")
def set_active(user_id: int, active: bool, db: SessionDep, admin: AdminUser):
    u = db.get(User, user_id)
    if u is None:
        raise not_found("User")
    if u.id == admin.id:
        raise AppError(400, "SELF", "You cannot disable your own account.")
    u.is_active = active
    db.commit()
    return user_out(u)


@router.get("/feedback")
def list_feedback(db: SessionDep, _: AdminUser):
    return [{"id": f.id, "type": f.type, "item_type": f.item_type, "item_id": f.item_id, "value": f.value,
             "rating": f.rating, "comment": f.comment, "email": f.email, "subject": f.subject,
             "created_at": iso(f.created_at)}
            for f in db.scalars(select(Feedback).order_by(Feedback.id.desc()).limit(200))]
