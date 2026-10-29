"""Skill extraction from resumes, projects and course titles (FR-10, FR-11)."""
import io
import json
import re

EDU_PATTERNS = [r"b\.?\s?tech", r"\bb\.?\s?e\b", r"m\.?\s?tech", r"b\.?\s?sc", r"m\.?\s?sc", r"\bbca\b",
                r"\bmca\b", r"bachelor", r"master", r"ph\.?\s?d", r"diploma"]
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")

# Level evidence per source (requirements section 6, step 1)
SOURCE_LEVEL = {"resume": 2, "course": 2, "project": 3}


def load_dictionary(conn):
    """skill_id -> list of lowercase synonyms (including the display name)."""
    out = {}
    for r in conn.execute("SELECT id, name, synonyms FROM skills"):
        syns = {s.lower() for s in json.loads(r["synonyms"] or "[]")}
        syns.add(r["name"].lower())
        out[r["id"]] = sorted(syns, key=len, reverse=True)
    return out


def _pattern(term):
    # boundaries that also work for terms like "node.js" or "ci/cd"
    return re.compile(r"(?<![\w])" + re.escape(term) + r"(?![\w])", re.IGNORECASE)


def extract_skills(text, dictionary):
    """Return the set of skill ids mentioned in text."""
    text = text or ""
    return {sid for sid, syns in dictionary.items() if any(_pattern(s).search(text) for s in syns)}


def pdf_to_text(file_bytes):
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def parse_resume(text, dictionary):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    email = EMAIL_RE.search(text)
    education = [line for line in lines if any(re.search(p, line, re.IGNORECASE) for p in EDU_PATTERNS)]
    return {
        "name": lines[0] if lines else "",
        "email": email.group(0) if email else "",
        "education": education[:3],
        "skills": sorted(extract_skills(text, dictionary)),
    }


def merge_skill(conn, user_id, skill_id, level, source):
    """Keep the highest evidence level seen for a skill."""
    row = conn.execute("SELECT level FROM student_skills WHERE user_id = ? AND skill_id = ?",
                       (user_id, skill_id)).fetchone()
    if row is None:
        conn.execute("INSERT INTO student_skills VALUES (?, ?, ?, ?)", (user_id, skill_id, level, source))
    elif level > row["level"]:
        conn.execute("UPDATE student_skills SET level = ?, source = ? WHERE user_id = ? AND skill_id = ?",
                     (level, source, user_id, skill_id))


def skills_from_profile(conn, user_id, dictionary):
    """Infer skills from the student's saved projects and courses."""
    found = {}
    for p in conn.execute("SELECT title, description, tech_stack FROM student_projects WHERE user_id = ?",
                          (user_id,)):
        text = " ".join(filter(None, [p["title"], p["description"], p["tech_stack"]]))
        for sid in extract_skills(text, dictionary):
            found[sid] = max(found.get(sid, 0), SOURCE_LEVEL["project"])
    for c in conn.execute("SELECT title FROM student_courses WHERE user_id = ?", (user_id,)):
        for sid in extract_skills(c["title"], dictionary):
            found.setdefault(sid, SOURCE_LEVEL["course"])
    return found


def student_levels(conn, user_id):
    return {r["skill_id"]: r["level"] for r in
            conn.execute("SELECT skill_id, level FROM student_skills WHERE user_id = ?", (user_id,))}
