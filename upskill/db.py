"""SQLite storage. All queries are parameterised (NFR-06)."""
import json
import os
import sqlite3
from pathlib import Path

from . import catalog_data as cd

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "upskill.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_active TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    degree TEXT, branch TEXT, year INTEGER, college TEXT,
    hours_per_week INTEGER DEFAULT 8,
    preferred_type TEXT DEFAULT 'any',
    target_role_id INTEGER REFERENCES roles(id),
    mentor_id INTEGER REFERENCES users(id),
    consent INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, synonyms TEXT
);
CREATE TABLE IF NOT EXISTS skill_prereqs (
    skill_id TEXT REFERENCES skills(id), prereq_skill_id TEXT REFERENCES skills(id),
    PRIMARY KEY (skill_id, prereq_skill_id)
);
CREATE TABLE IF NOT EXISTS student_skills (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id),
    level INTEGER NOT NULL CHECK (level BETWEEN 0 AND 5),
    source TEXT NOT NULL,
    PRIMARY KEY (user_id, skill_id)
);
CREATE TABLE IF NOT EXISTS student_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, grade TEXT
);
CREATE TABLE IF NOT EXISTS student_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, description TEXT, tech_stack TEXT, link TEXT
);
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT UNIQUE NOT NULL, description TEXT
);
CREATE TABLE IF NOT EXISTS role_skills (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id),
    weight INTEGER NOT NULL CHECK (weight BETWEEN 1 AND 3),
    required_level INTEGER NOT NULL CHECK (required_level BETWEEN 1 AND 5),
    PRIMARY KEY (role_id, skill_id)
);
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id TEXT REFERENCES skills(id),
    title TEXT NOT NULL, provider TEXT, url TEXT, type TEXT,
    level INTEGER, duration_hrs REAL, is_free INTEGER, rating REAL
);
CREATE TABLE IF NOT EXISTS projects_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id TEXT REFERENCES skills(id),
    title TEXT NOT NULL, level INTEGER, est_hours REAL, description TEXT
);
CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, provider TEXT, cost TEXT, url TEXT
);
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id TEXT REFERENCES skills(id),
    question TEXT NOT NULL, options TEXT NOT NULL, answer INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS learning_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    est_finish TEXT,
    status TEXT DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS path_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path_id INTEGER REFERENCES learning_paths(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id),
    order_no INTEGER, week_no INTEGER, hours REAL, due_date TEXT,
    status TEXT DEFAULT 'Not started', reason TEXT
);
CREATE TABLE IF NOT EXISTS path_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER REFERENCES path_modules(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, item_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Not started', reason TEXT, link TEXT
);
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id TEXT, score REAL, taken_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT, item_id INTEGER, value TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, resource_id)
);
CREATE TABLE IF NOT EXISTS recommendation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item TEXT, reason TEXT, action TEXT,
    at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


def db_path():
    return Path(os.environ.get("UPSKILL_DB", DEFAULT_DB))


def connect(path=None):
    path = Path(path) if path else db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn, with_demo=True):
    conn.executescript(SCHEMA)
    if conn.execute("SELECT COUNT(*) FROM skills").fetchone()[0] == 0:
        seed_catalog(conn)
    if with_demo and conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        seed_demo_users(conn)
    conn.commit()


def seed_catalog(conn):
    conn.executemany(
        "INSERT INTO skills (id, name, category, synonyms) VALUES (?, ?, ?, ?)",
        [(sid, n, c, json.dumps(syn)) for sid, (n, c, syn) in cd.SKILLS.items()])
    conn.executemany("INSERT INTO skill_prereqs VALUES (?, ?)", cd.PREREQS)
    for title, (desc, reqs) in cd.ROLES.items():
        rid = conn.execute("INSERT INTO roles (title, description) VALUES (?, ?)", (title, desc)).lastrowid
        conn.executemany("INSERT INTO role_skills VALUES (?, ?, ?, ?)", [(rid, s, w, l) for s, w, l in reqs])
    conn.executemany(
        "INSERT INTO resources (skill_id, title, provider, url, type, level, duration_hrs, is_free, rating) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", cd.RESOURCES)
    conn.executemany(
        "INSERT INTO projects_catalog (skill_id, title, level, est_hours, description) VALUES (?, ?, ?, ?, ?)",
        cd.PROJECTS)
    role_ids = {r["title"]: r["id"] for r in conn.execute("SELECT id, title FROM roles")}
    conn.executemany(
        "INSERT INTO certifications (role_id, name, provider, cost, url) VALUES (?, ?, ?, ?, ?)",
        [(role_ids[r], n, p, c, u) for r, n, p, c, u in cd.CERTIFICATIONS])
    conn.executemany(
        "INSERT INTO quiz_questions (skill_id, question, options, answer) VALUES (?, ?, ?, ?)",
        [(s, q, json.dumps(o), a) for s, q, o, a in cd.QUIZ])


def seed_demo_users(conn):
    from .auth import hash_password
    users = [("Admin User", "admin@demo.com", "admin123", "admin"),
             ("Dr. Mentor", "mentor@demo.com", "mentor123", "mentor"),
             ("Demo Student", "student@demo.com", "student123", "student")]
    ids = {}
    for name, email, pw, role in users:
        ids[role] = conn.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (name, email, hash_password(pw), role)).lastrowid
    role_id = conn.execute("SELECT id FROM roles WHERE title = 'Data Scientist'").fetchone()[0]
    conn.execute(
        "INSERT INTO student_profiles (user_id, degree, branch, year, college, hours_per_week, "
        "preferred_type, target_role_id, mentor_id, consent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
        (ids["student"], "B.Tech", "Computer Science", 3, "Demo Institute", 10, "course", role_id, ids["mentor"]))
    conn.executemany(
        "INSERT INTO student_skills VALUES (?, ?, ?, ?)",
        [(ids["student"], "python", 3, "self"), (ids["student"], "sql", 2, "self"),
         (ids["student"], "git", 2, "project"), (ids["student"], "excel", 3, "self")])
    conn.execute("INSERT INTO student_courses (user_id, title, grade) VALUES (?, ?, ?)",
                 (ids["student"], "Database Management Systems", "A"))
    conn.execute("INSERT INTO student_projects (user_id, title, description, tech_stack, link) VALUES (?, ?, ?, ?, ?)",
                 (ids["student"], "Attendance tracker", "Flask app to record class attendance", "Python, Flask, SQLite, Git", ""))


def skill_names(conn):
    return {r["id"]: r["name"] for r in conn.execute("SELECT id, name FROM skills ORDER BY name")}


def touch(conn, user_id):
    conn.execute("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?", (user_id,))
    conn.commit()


def log(conn, user_id, item, reason, action):
    conn.execute("INSERT INTO recommendation_log (user_id, item, reason, action) VALUES (?, ?, ?, ?)",
                 (user_id, item, reason, action))
