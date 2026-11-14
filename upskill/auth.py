"""Registration, login and password hashing (FR-01..03, NFR-05)."""
import re

import bcrypt

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password, hashed):
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def register(conn, name, email, password, role="student"):
    """Create a user. Returns (user_id, error)."""
    email = email.strip().lower()
    if not name.strip():
        return None, "Name is required."
    if not EMAIL_RE.match(email):
        return None, "Enter a valid email address."
    if len(password) < 6:
        return None, "Password must be at least 6 characters."
    if role not in ("student", "mentor", "admin"):
        return None, "Invalid role."
    if conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        return None, "An account with this email already exists."
    uid = conn.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        (name.strip(), email, hash_password(password), role)).lastrowid
    if role == "student":
        conn.execute("INSERT INTO student_profiles (user_id) VALUES (?)", (uid,))
    conn.commit()
    return uid, None


def login(conn, email, password):
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
    if row and check_password(password, row["password_hash"]):
        return dict(row)
    return None


def change_password(conn, user_id, new_password):
    if len(new_password) < 6:
        return "Password must be at least 6 characters."
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), user_id))
    conn.commit()
    return None
