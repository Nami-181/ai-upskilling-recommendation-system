"""LUMORA AI engine: skill taxonomy, skill-gap scoring, recommendations and adaptation.

Pure Python + pandas/NumPy, no database access, so it can be tested on its own
and reused by the FastAPI backend.
"""
from .adaptive import feedback_replacement, grade_quiz, quiz_decision
from .catalog import Catalog
from .gap import analyze_gap, career_readiness
from .planner import build_learning_path
from .recommender import recommend_certifications, recommend_project, recommend_resources

__all__ = [
    "Catalog", "analyze_gap", "career_readiness", "build_learning_path", "recommend_resources",
    "recommend_project", "recommend_certifications", "grade_quiz", "quiz_decision", "feedback_replacement",
]
