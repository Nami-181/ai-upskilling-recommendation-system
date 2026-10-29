"""Streamlit entry point: streamlit run app.py"""
import json
from datetime import date, timedelta

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from upskill import adapt, auth, db, planner
from upskill.gap import compute_gap, role_requirements
from upskill.skills import (SOURCE_LEVEL, load_dictionary, merge_skill, parse_resume, pdf_to_text,
                            skills_from_profile, student_levels)

st.set_page_config(page_title="SkillPath AI", page_icon="🎯", layout="wide")

STATUSES = ["Not started", "In progress", "Done"]
TYPES = ["any", "course", "video", "docs", "article"]
MAX_RESUME_MB = 5


@st.cache_resource
def get_conn():
    conn = db.connect()
    db.init_db(conn)
    return conn


conn = get_conn()


# ---------- helpers ----------

def current_user():
    return st.session_state.get("user")


def roles_map():
    return {r["id"]: r["title"] for r in conn.execute("SELECT id, title FROM roles ORDER BY title")}


def profile(uid):
    return conn.execute("SELECT * FROM student_profiles WHERE user_id = ?", (uid,)).fetchone()


def path_progress(path_id):
    """Average module progress: Done = 1, otherwise share of finished items (max 0.9)."""
    mods = conn.execute("SELECT id, status FROM path_modules WHERE path_id = ?", (path_id,)).fetchall()
    if not mods:
        return 0.0, 0, 0
    total = 0.0
    done = 0
    for m in mods:
        if m["status"] == "Done":
            total += 1
            done += 1
            continue
        items = conn.execute("SELECT status FROM path_items WHERE module_id = ?", (m["id"],)).fetchall()
        if items:
            total += 0.9 * sum(i["status"] == "Done" for i in items) / len(items)
    return round(100 * total / len(mods), 1), done, len(mods)


def streak(uid):
    days = {r[0] for r in conn.execute(
        "SELECT DATE(at) FROM recommendation_log WHERE user_id = ? AND action IN ('progress', 'quiz') "
        "UNION SELECT DATE(taken_at) FROM quiz_attempts WHERE user_id = ?", (uid, uid))}
    d, n = date.today(), 0
    if d.isoformat() not in days:
        d -= timedelta(days=1)
    while d.isoformat() in days:
        n += 1
        d -= timedelta(days=1)
    return n


def readiness_for(uid, role_id):
    if not role_id:
        return 0.0
    return compute_gap(student_levels(conn, uid), role_requirements(conn, role_id))["readiness"]


def save_table(table, original, edited, cols):
    """Apply a data_editor result: update changed rows, insert new ones, delete removed ones."""
    orig_ids = set(original["id"].dropna().astype(int))
    kept = set()
    for _, row in edited.iterrows():
        values = [None if pd.isna(row[c]) else row[c] for c in cols]
        if pd.notna(row.get("id")):
            rid = int(row["id"])
            kept.add(rid)
            conn.execute(f"UPDATE {table} SET {', '.join(c + ' = ?' for c in cols)} WHERE id = ?", (*values, rid))
        elif any(v not in (None, "") for v in values):
            conn.execute(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join('?' * len(cols))})", values)
    for rid in orig_ids - kept:
        conn.execute(f"DELETE FROM {table} WHERE id = ?", (rid,))
    conn.commit()


# ---------- auth pages ----------

def login_page():
    st.title("🎯 SkillPath AI")
    st.caption("Personalised upskilling paths for students: profile → skill gap → learning path → progress → adapt.")
    tab_in, tab_up = st.tabs(["Log in", "Sign up"])
    with tab_in:
        with st.form("login"):
            email = st.text_input("Email")
            pw = st.text_input("Password", type="password")
            if st.form_submit_button("Log in", type="primary"):
                user = auth.login(conn, email, pw)
                if user:
                    st.session_state.user = user
                    st.rerun()
                st.error("Wrong email or password.")
        st.info("Demo accounts: student@demo.com / student123 · mentor@demo.com / mentor123 · admin@demo.com / admin123")
    with tab_up:
        with st.form("signup"):
            name = st.text_input("Full name")
            email = st.text_input("Email ")
            pw = st.text_input("Password (min 6 characters)", type="password")
            role = st.selectbox("I am a", ["student", "mentor"])
            if st.form_submit_button("Create account", type="primary"):
                uid, err = auth.register(conn, name, email, pw, role)
                if err:
                    st.error(err)
                else:
                    st.success("Account created. Log in from the first tab.")


# ---------- student pages ----------

def student_dashboard(user):
    uid = user["id"]
    prof = profile(uid)
    st.title(f"Hi {user['name'].split()[0]} 👋")
    if adapt.is_inactive(user["last_active"]):
        st.warning("You haven't been active for over a week. Pick one small task below to get back on track!")
    path = planner.active_path(conn, uid)
    role = roles_map().get(prof["target_role_id"]) if prof else None
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Target role", role or "Not set")
    c2.metric("Role readiness", f"{readiness_for(uid, prof['target_role_id'] if prof else None):.0f}%")
    if path:
        pct, done, total = path_progress(path["id"])
        c3.metric("Path complete", f"{pct:.0f}%", f"{done}/{total} modules")
        c4.metric("Learning streak", f"{streak(uid)} days", f"finish {path['est_finish']}", delta_color="off")
        st.progress(min(1.0, pct / 100))
        st.subheader("Up next")
        nxt = conn.execute(
            "SELECT pm.*, s.name FROM path_modules pm JOIN skills s ON s.id = pm.skill_id "
            "WHERE path_id = ? AND status != 'Done' ORDER BY order_no LIMIT 3", (path["id"],)).fetchall()
        for m in nxt:
            st.markdown(f"**Week {m['week_no']} · {m['name']}** — due {m['due_date']} · {m['status']}  \n"
                        f"<small>{m['reason']}</small>", unsafe_allow_html=True)
        if not nxt:
            st.success("All modules done. Time for the certification! 🎉")
        scores = pd.read_sql_query(
            "SELECT taken_at, skill_id, score FROM quiz_attempts WHERE user_id = ? ORDER BY taken_at", conn, params=(uid,))
        if not scores.empty:
            st.subheader("Quiz scores")
            st.line_chart(scores, x="taken_at", y="score", color="skill_id")
    else:
        c3.metric("Path complete", "—")
        c4.metric("Learning streak", f"{streak(uid)} days")
        st.info("Next steps: 1) fill in **My profile** or upload a **Resume**, 2) pick a target role, "
                "3) open **Learning path** and click Generate.")


def profile_page(user):
    uid = user["id"]
    prof = profile(uid)
    names = db.skill_names(conn)
    roles = roles_map()
    st.title("My profile")
    with st.form("profile"):
        c1, c2 = st.columns(2)
        degree = c1.text_input("Degree", prof["degree"] or "")
        branch = c2.text_input("Branch / major", prof["branch"] or "")
        college = c1.text_input("College", prof["college"] or "")
        year = c2.number_input("Year of study", 1, 6, prof["year"] or 1)
        hours = c1.slider("Hours available per week", 2, 40, prof["hours_per_week"] or 8)
        ptype = c2.selectbox("Preferred resource type", TYPES,
                             TYPES.index(prof["preferred_type"]) if prof["preferred_type"] in TYPES else 0)
        role_ids = list(roles)
        target = st.selectbox("Target role", role_ids, format_func=roles.get,
                              index=role_ids.index(prof["target_role_id"]) if prof["target_role_id"] in role_ids else 0)
        if st.form_submit_button("Save profile", type="primary"):
            conn.execute("UPDATE student_profiles SET degree=?, branch=?, college=?, year=?, hours_per_week=?, "
                         "preferred_type=?, target_role_id=? WHERE user_id=?",
                         (degree, branch, college, year, hours, ptype, target, uid))
            conn.commit()
            st.success("Saved. Regenerate your path to apply changes to role or hours.")

    st.subheader("Skills")
    st.caption("Level: 1 = heard of it · 2 = basics · 3 = built something · 4 = confident · 5 = expert")
    sk = pd.read_sql_query("SELECT skill_id, level, source FROM student_skills WHERE user_id = ?", conn, params=(uid,))
    sk["skill"] = sk["skill_id"].map(names)
    edited = st.data_editor(
        sk[["skill", "level", "source"]], num_rows="dynamic", key="skills_ed", width="stretch",
        column_config={"skill": st.column_config.SelectboxColumn("Skill", options=sorted(names.values()), required=True),
                       "level": st.column_config.NumberColumn("Level", min_value=0, max_value=5, step=1, required=True),
                       "source": st.column_config.TextColumn("Source", disabled=True)})
    if st.button("Save skills"):
        by_name = {v: k for k, v in names.items()}
        conn.execute("DELETE FROM student_skills WHERE user_id = ?", (uid,))
        for _, r in edited.dropna(subset=["skill"]).iterrows():
            src = r["source"] if isinstance(r["source"], str) and r["source"] else "self"
            conn.execute("INSERT OR REPLACE INTO student_skills VALUES (?, ?, ?, ?)",
                         (uid, by_name[r["skill"]], int(r["level"] if pd.notna(r["level"]) else 1), src))
        conn.commit()
        st.success("Skills saved.")

    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Completed courses")
        cs = pd.read_sql_query("SELECT id, title, grade FROM student_courses WHERE user_id = ?", conn, params=(uid,))
        ced = st.data_editor(cs, num_rows="dynamic", key="courses_ed", width="stretch",
                             column_config={"id": None})
        if st.button("Save courses"):
            ced = ced.assign(user_id=uid)
            save_table("student_courses", cs, ced, ["user_id", "title", "grade"])
            st.success("Courses saved.")
    with c2:
        st.subheader("Projects")
        ps = pd.read_sql_query("SELECT id, title, description, tech_stack, link FROM student_projects WHERE user_id = ?",
                               conn, params=(uid,))
        ped = st.data_editor(ps, num_rows="dynamic", key="proj_ed", width="stretch", column_config={"id": None})
        if st.button("Save projects"):
            ped = ped.assign(user_id=uid)
            save_table("student_projects", ps, ped, ["user_id", "title", "description", "tech_stack", "link"])
            st.success("Projects saved.")

    st.subheader("Detect skills from my projects and courses")
    found = skills_from_profile(conn, uid, load_dictionary(conn))
    levels = student_levels(conn, uid)
    new = {s: lv for s, lv in found.items() if lv > levels.get(s, 0)}
    if new:
        pick = st.multiselect("Confirm skills to add / upgrade", list(new), default=list(new),
                              format_func=lambda s: f"{names[s]} → level {new[s]}")
        if st.button("Add confirmed skills", type="primary"):
            for s in pick:
                merge_skill(conn, uid, s, new[s], "project" if new[s] == SOURCE_LEVEL["project"] else "course")
            conn.commit()
            st.rerun()
    else:
        st.caption("Nothing new found. Add projects with a tech stack to detect more skills.")


def resume_page(user):
    uid = user["id"]
    names = db.skill_names(conn)
    st.title("Upload resume")
    prof = profile(uid)
    consent = st.checkbox("I agree that my resume is processed to extract skills. It is not shared with anyone.",
                          value=bool(prof["consent"]))
    if consent != bool(prof["consent"]):
        conn.execute("UPDATE student_profiles SET consent = ? WHERE user_id = ?", (int(consent), uid))
        conn.commit()
    if not consent:
        st.info("Tick the consent box to upload.")
        return
    f = st.file_uploader("Resume (PDF, max 5 MB)", type=["pdf"])
    if f is None:
        return
    if f.size > MAX_RESUME_MB * 1024 * 1024:
        st.error("File is larger than 5 MB.")
        return
    try:
        text = pdf_to_text(f.getvalue())
    except Exception:
        st.error("Couldn't read this PDF. Try exporting it again as a text PDF.")
        return
    parsed = parse_resume(text, load_dictionary(conn))
    c1, c2 = st.columns(2)
    c1.write(f"**Name:** {parsed['name']}")
    c1.write(f"**Email:** {parsed['email'] or '—'}")
    c2.write("**Education:** " + ("; ".join(parsed["education"]) or "—"))
    if not parsed["skills"]:
        st.warning("No known skills found. Add them manually on My profile.")
        return
    pick = st.multiselect("Skills found — remove any that are wrong", parsed["skills"], default=parsed["skills"],
                          format_func=names.get)
    if st.button("Add to my profile", type="primary"):
        for s in pick:
            merge_skill(conn, uid, s, SOURCE_LEVEL["resume"], "resume")
        db.log(conn, uid, "resume", f"{len(pick)} skills confirmed", "profile")
        conn.commit()
        st.success(f"Added {len(pick)} skills at level 2. Raise levels on My profile or prove them with a quiz.")


def gap_page(user):
    uid = user["id"]
    prof = profile(uid)
    roles = roles_map()
    names = db.skill_names(conn)
    st.title("Skill gap analysis")
    ids = list(roles)
    rid = st.selectbox("Compare me with", ids, format_func=roles.get,
                       index=ids.index(prof["target_role_id"]) if prof["target_role_id"] in ids else 0)
    res = compute_gap(student_levels(conn, uid), role_requirements(conn, rid))
    st.metric("Role readiness", f"{res['readiness']:.0f}%")
    df = pd.DataFrame(res["rows"])
    df["skill"] = df["skill_id"].map(names)
    fig = go.Figure([go.Bar(name="You have", y=df["skill"], x=df["have"], orientation="h"),
                     go.Bar(name="Role needs", y=df["skill"], x=df["required"], orientation="h")])
    fig.update_layout(barmode="group", height=60 + 40 * len(df), xaxis_title="Level (0–5)",
                      yaxis=dict(autorange="reversed"), margin=dict(l=10, r=10, t=10, b=10))
    st.plotly_chart(fig, width="stretch")
    st.dataframe(df[["skill", "have", "required", "weight", "gap", "severity"]], hide_index=True, width="stretch")
    if rid != prof["target_role_id"] and st.button("Make this my target role"):
        conn.execute("UPDATE student_profiles SET target_role_id = ? WHERE user_id = ?", (rid, uid))
        conn.commit()
        st.rerun()


def set_item_status(uid, item_id, module_id, status, path_id, hpw):
    conn.execute("UPDATE path_items SET status = ? WHERE id = ?", (status, item_id))
    items = conn.execute("SELECT status FROM path_items WHERE module_id = ?", (module_id,)).fetchall()
    mod_status = "Done" if all(i["status"] == "Done" for i in items) else \
        "In progress" if any(i["status"] != "Not started" for i in items) else "Not started"
    conn.execute("UPDATE path_modules SET status = ? WHERE id = ?", (mod_status, module_id))
    db.log(conn, uid, f"item {item_id}", status, "progress")
    planner.reschedule_path(conn, path_id, hpw)
    conn.commit()


def path_page(user):
    uid = user["id"]
    prof = profile(uid)
    roles = roles_map()
    st.title("My learning path")
    if not prof["target_role_id"]:
        st.warning("Choose a target role on My profile first.")
        return
    path = planner.active_path(conn, uid)
    label = "Regenerate path" if path else "Generate my path"
    if st.button(label, type="primary"):
        planner.generate_path(conn, uid)
        st.rerun()
    if not path:
        st.info(f"Your path will target **{roles[prof['target_role_id']]}** at {prof['hours_per_week']} h/week.")
        return
    pct, done, total = path_progress(path["id"])
    c1, c2, c3 = st.columns(3)
    c1.metric("Target role", roles[path["role_id"]])
    c2.metric("Progress", f"{pct:.0f}%", f"{done}/{total} modules")
    c3.metric("Estimated finish", path["est_finish"])
    if path["role_id"] != prof["target_role_id"]:
        st.warning("Your target role changed. Regenerate to update the path.")

    mods = conn.execute("SELECT pm.*, s.name FROM path_modules pm JOIN skills s ON s.id = pm.skill_id "
                        "WHERE path_id = ? ORDER BY order_no", (path["id"],)).fetchall()
    bookmarks = {r[0] for r in conn.execute("SELECT resource_id FROM bookmarks WHERE user_id = ?", (uid,))}
    for m in mods:
        icon = "✅" if m["status"] == "Done" else "🟡" if m["status"] == "In progress" else "⬜"
        head = f"{icon} {m['order_no']}. {m['name']} — week {m['week_no']}, due {m['due_date']} · {m['hours']:.0f} h"
        with st.expander(head, expanded=(m["status"] != "Done" and m["order_no"] <= 2)):
            st.caption(f"Why: {m['reason']}")
            items = conn.execute("SELECT * FROM path_items WHERE module_id = ? ORDER BY item_type DESC, id",
                                 (m["id"],)).fetchall()
            for it in items:
                if it["item_type"] == "resource":
                    r = conn.execute("SELECT * FROM resources WHERE id = ?", (it["item_id"],)).fetchone()
                    if not r:
                        continue
                    c1, c2, c3, c4 = st.columns([6, 2, 2, 1])
                    c1.markdown(f"📘 [{r['title']}]({r['url']}) · {r['provider']}  \n"
                                f"<small>{r['type']} · level {r['level']} · ~{r['duration_hrs']:.0f} h · "
                                f"{'free' if r['is_free'] else 'paid'} · ⭐ {r['rating']}<br>{it['reason']}</small>",
                                unsafe_allow_html=True)
                else:
                    r = conn.execute("SELECT * FROM projects_catalog WHERE id = ?", (it["item_id"],)).fetchone()
                    if not r:
                        continue
                    c1, c2, c3, c4 = st.columns([6, 2, 2, 1])
                    c1.markdown(f"🛠️ **Project: {r['title']}** · ~{r['est_hours']:.0f} h  \n"
                                f"<small>{r['description']}</small>", unsafe_allow_html=True)
                new_status = c2.selectbox("Status", STATUSES, STATUSES.index(it["status"]),
                                          key=f"st{it['id']}", label_visibility="collapsed")
                if new_status != it["status"]:
                    set_item_status(uid, it["id"], m["id"], new_status, path["id"], prof["hours_per_week"])
                    st.rerun()
                if it["item_type"] == "resource":
                    fb = c3.selectbox("Feedback", ["—", "too_easy", "too_hard", "not_relevant"], key=f"fb{it['id']}",
                                      label_visibility="collapsed", format_func=lambda v: v.replace("_", " "))
                    if fb != "—":
                        st.toast(adapt.give_feedback(conn, uid, it["id"], fb))
                        st.session_state.pop(f"fb{it['id']}", None)
                        st.rerun()
                    marked = it["item_id"] in bookmarks
                    if c4.button("★" if marked else "☆", key=f"bm{it['id']}", help="Bookmark"):
                        if marked:
                            conn.execute("DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?", (uid, it["item_id"]))
                        else:
                            conn.execute("INSERT OR IGNORE INTO bookmarks VALUES (?, ?)", (uid, it["item_id"]))
                        conn.commit()
                        st.rerun()
                else:
                    link = c3.text_input("Submission link", it["link"] or "", key=f"ln{it['id']}",
                                         placeholder="GitHub link", label_visibility="collapsed")
                    if link != (it["link"] or ""):
                        conn.execute("UPDATE path_items SET link = ? WHERE id = ?", (link, it["id"]))
                        conn.commit()
            st.caption("Know this already? Take the quiz on the Quizzes page; 80%+ completes the module.")

    st.subheader("Recommended certifications")
    for c in conn.execute("SELECT * FROM certifications WHERE role_id = ?", (path["role_id"],)):
        st.markdown(f"🏅 [{c['name']}]({c['url']}) · {c['provider']} · {c['cost']}")


def quiz_page(user):
    uid = user["id"]
    names = db.skill_names(conn)
    st.title("Skill quizzes")
    st.caption("80% or more marks the skill as acquired and completes its module. "
               "Under 50% adds easier material and gives the module another week.")
    path = planner.active_path(conn, uid)
    path_skills = [r[0] for r in conn.execute(
        "SELECT skill_id FROM path_modules WHERE path_id = ? ORDER BY order_no", (path["id"],))] if path else []
    quiz_skills = [r[0] for r in conn.execute("SELECT DISTINCT skill_id FROM quiz_questions")]
    options = path_skills + sorted((s for s in quiz_skills if s not in path_skills), key=names.get)
    options = [s for s in options if s in quiz_skills]
    skill = st.selectbox("Skill", options, format_func=lambda s: names[s] + (" (in your path)" if s in path_skills else ""))
    qs = conn.execute("SELECT * FROM quiz_questions WHERE skill_id = ? ORDER BY id", (skill,)).fetchall()
    with st.form(f"quiz_{skill}"):
        answers = []
        for i, q in enumerate(qs, 1):
            opts = json.loads(q["options"])
            answers.append(st.radio(f"{i}. {q['question']}", range(len(opts)), format_func=lambda k, o=opts: o[k],
                                    index=None, key=f"q{q['id']}"))
        if st.form_submit_button("Submit", type="primary"):
            if any(a is None for a in answers):
                st.error("Answer every question.")
            else:
                score = 100 * sum(a == q["answer"] for a, q in zip(answers, qs)) / len(qs)
                db.log(conn, uid, f"quiz {skill}", f"{score:.0f}%", "quiz")
                for msg in adapt.record_quiz(conn, uid, skill, score):
                    st.success(msg) if score >= adapt.FAIL else st.warning(msg)
    hist = pd.read_sql_query("SELECT taken_at, skill_id, score FROM quiz_attempts WHERE user_id = ? ORDER BY id DESC",
                             conn, params=(uid,))
    if not hist.empty:
        st.subheader("History")
        hist["skill"] = hist["skill_id"].map(names)
        st.dataframe(hist[["taken_at", "skill", "score"]], hide_index=True, width="stretch")


def portfolio_page(user):
    uid = user["id"]
    names = db.skill_names(conn)
    prof = profile(uid)
    st.title("Portfolio export")
    skills = pd.read_sql_query("SELECT skill_id, level, source FROM student_skills WHERE user_id = ? AND level >= 3 "
                               "ORDER BY level DESC", conn, params=(uid,))
    skills["skill"] = skills["skill_id"].map(names)
    projects = pd.read_sql_query(
        "SELECT pc.title, pi.link, pi.status FROM path_items pi JOIN projects_catalog pc ON pc.id = pi.item_id "
        "JOIN path_modules pm ON pm.id = pi.module_id JOIN learning_paths lp ON lp.id = pm.path_id "
        "WHERE lp.user_id = ? AND pi.item_type = 'project' AND pi.status = 'Done'", conn, params=(uid,))
    own = pd.read_sql_query("SELECT title, link FROM student_projects WHERE user_id = ?", conn, params=(uid,))
    quizzes = pd.read_sql_query("SELECT skill_id, MAX(score) AS best FROM quiz_attempts WHERE user_id = ? "
                                "GROUP BY skill_id", conn, params=(uid,))
    quizzes["skill"] = quizzes["skill_id"].map(names)
    st.subheader("Skills (level 3+)")
    st.dataframe(skills[["skill", "level", "source"]], hide_index=True, width="stretch")
    st.subheader("Projects")
    st.dataframe(pd.concat([own, projects[["title", "link"]]], ignore_index=True), hide_index=True, width="stretch")
    st.subheader("Best quiz scores")
    st.dataframe(quizzes[["skill", "best"]], hide_index=True, width="stretch")

    rows = [("Skill", r.skill, f"level {r.level}") for r in skills.itertuples()] + \
           [("Project", r.title, r.link or "") for r in pd.concat([own, projects[["title", "link"]]]).itertuples()] + \
           [("Quiz", r.skill, f"{r.best:.0f}%") for r in quizzes.itertuples()]
    csv = pd.DataFrame(rows, columns=["type", "name", "detail"]).to_csv(index=False)
    role = roles_map().get(prof["target_role_id"], "")
    html = (f"<html><head><meta charset='utf-8'><title>{user['name']} portfolio</title></head>"
            f"<body style='font-family:sans-serif;max-width:720px;margin:auto'><h1>{user['name']}</h1>"
            f"<p>{prof['degree'] or ''} {prof['branch'] or ''} · {prof['college'] or ''} · Target: {role}</p>"
            + "".join(f"<h2>{t}s</h2><ul>" + "".join(f"<li>{n} — {d}</li>" for tt, n, d in rows if tt == t) + "</ul>"
                      for t in ("Skill", "Project", "Quiz"))
            + f"<p><small>Generated {date.today()} by SkillPath AI</small></p></body></html>")
    c1, c2 = st.columns(2)
    c1.download_button("Download CSV", csv, "portfolio.csv", "text/csv")
    c2.download_button("Download printable page (save as PDF)", html, "portfolio.html", "text/html")


def account_page(user):
    uid = user["id"]
    st.title("Account and privacy")
    with st.form("pw"):
        new = st.text_input("New password", type="password")
        if st.form_submit_button("Change password"):
            err = auth.change_password(conn, uid, new)
            st.error(err) if err else st.success("Password changed.")
    if user["role"] == "student":
        data = {t: pd.read_sql_query(f"SELECT * FROM {t} WHERE user_id = ?", conn, params=(uid,)).to_dict("records")
                for t in ("student_profiles", "student_skills", "student_courses", "student_projects",
                          "quiz_attempts", "feedback", "learning_paths", "recommendation_log")}
        st.download_button("Download my data (JSON)", json.dumps(data, indent=2, default=str), "my_data.json")
    st.divider()
    confirm = st.text_input("Type DELETE to permanently delete your account and data")
    if st.button("Delete my account", type="secondary", disabled=confirm != "DELETE"):
        conn.execute("DELETE FROM users WHERE id = ?", (uid,))
        conn.commit()
        st.session_state.clear()
        st.rerun()


# ---------- mentor ----------

def mentor_page(user):
    st.title("My students")
    roles = roles_map()
    names = db.skill_names(conn)
    studs = conn.execute("SELECT u.*, sp.target_role_id FROM users u JOIN student_profiles sp ON sp.user_id = u.id "
                         "WHERE sp.mentor_id = ?", (user["id"],)).fetchall()
    if not studs:
        st.info("No students assigned yet. An admin assigns students on the Users page.")
        return
    rows = []
    for s in studs:
        path = planner.active_path(conn, s["id"])
        pct = path_progress(path["id"])[0] if path else 0.0
        last = conn.execute("SELECT score FROM quiz_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                            (s["id"],)).fetchone()
        ready = readiness_for(s["id"], s["target_role_id"])
        inactive = adapt.is_inactive(s["last_active"])
        rows.append({"id": s["id"], "Student": s["name"], "Email": s["email"], "Target role": roles.get(s["target_role_id"], "—"),
                     "Readiness %": ready, "Progress %": pct, "Last quiz %": last["score"] if last else None,
                     "Last active": s["last_active"], "Risk": adapt.risk_flag(ready, pct, last["score"] if last else None, inactive)})
    df = pd.DataFrame(rows).sort_values("Risk", key=lambda c: c.map({"High": 0, "Medium": 1, "Low": 2}))
    st.dataframe(df.drop(columns="id"), hide_index=True, width="stretch")
    sid = st.selectbox("View student", df["id"], format_func=lambda i: df.set_index("id").loc[i, "Student"])
    s = next(x for x in studs if x["id"] == sid)
    if s["target_role_id"]:
        g = compute_gap(student_levels(conn, sid), role_requirements(conn, s["target_role_id"]))
        gdf = pd.DataFrame(g["rows"])
        gdf["skill"] = gdf["skill_id"].map(names)
        st.dataframe(gdf[["skill", "have", "required", "severity"]], hide_index=True, width="stretch")
    path = planner.active_path(conn, sid)
    if path:
        mods = pd.read_sql_query("SELECT pm.order_no, s.name AS skill, pm.week_no, pm.due_date, pm.status FROM path_modules pm "
                                 "JOIN skills s ON s.id = pm.skill_id WHERE path_id = ? ORDER BY order_no", conn, params=(path["id"],))
        st.dataframe(mods, hide_index=True, width="stretch")


# ---------- admin ----------

def admin_page(user):
    st.title("Admin")
    names = db.skill_names(conn)
    skill_ids = sorted(names)
    tabs = st.tabs(["Resources", "Projects", "Certifications", "Quiz questions", "Roles & skills", "Users", "Stats"])
    skill_col = st.column_config.SelectboxColumn("skill_id", options=skill_ids, required=True)

    with tabs[0]:
        df = pd.read_sql_query("SELECT * FROM resources ORDER BY skill_id, level", conn)
        ed = st.data_editor(df, num_rows="dynamic", key="res_ed", width="stretch", column_config={
            "id": st.column_config.NumberColumn(disabled=True), "skill_id": skill_col,
            "type": st.column_config.SelectboxColumn(options=TYPES[1:]),
            "level": st.column_config.NumberColumn(min_value=1, max_value=3),
            "is_free": st.column_config.NumberColumn(min_value=0, max_value=1),
            "rating": st.column_config.NumberColumn(min_value=0, max_value=5, format="%.1f")})
        if st.button("Save resources"):
            save_table("resources", df, ed, ["skill_id", "title", "provider", "url", "type", "level",
                                             "duration_hrs", "is_free", "rating"])
            st.success("Saved.")
    with tabs[1]:
        df = pd.read_sql_query("SELECT * FROM projects_catalog ORDER BY skill_id", conn)
        ed = st.data_editor(df, num_rows="dynamic", key="proj_cat_ed", width="stretch",
                            column_config={"id": st.column_config.NumberColumn(disabled=True), "skill_id": skill_col})
        if st.button("Save projects"):
            save_table("projects_catalog", df, ed, ["skill_id", "title", "level", "est_hours", "description"])
            st.success("Saved.")
    with tabs[2]:
        roles = roles_map()
        df = pd.read_sql_query("SELECT * FROM certifications ORDER BY role_id", conn)
        ed = st.data_editor(df, num_rows="dynamic", key="cert_ed", width="stretch", column_config={
            "id": st.column_config.NumberColumn(disabled=True),
            "role_id": st.column_config.SelectboxColumn(options=list(roles), help=", ".join(f"{k}={v}" for k, v in roles.items()))})
        if st.button("Save certifications"):
            save_table("certifications", df, ed, ["role_id", "name", "provider", "cost", "url"])
            st.success("Saved.")
    with tabs[3]:
        st.caption('Options are a JSON list, e.g. ["A", "B", "C", "D"]; answer is the 0-based index of the right option.')
        df = pd.read_sql_query("SELECT * FROM quiz_questions ORDER BY skill_id", conn)
        ed = st.data_editor(df, num_rows="dynamic", key="quiz_ed", width="stretch",
                            column_config={"id": st.column_config.NumberColumn(disabled=True), "skill_id": skill_col})
        if st.button("Save questions"):
            try:
                for o in ed["options"].dropna():
                    json.loads(o)
                save_table("quiz_questions", df, ed, ["skill_id", "question", "options", "answer"])
                st.success("Saved.")
            except json.JSONDecodeError:
                st.error("An options cell isn't valid JSON.")
    with tabs[4]:
        roles = roles_map()
        rid = st.selectbox("Role", list(roles), format_func=roles.get)
        df = pd.read_sql_query("SELECT skill_id, weight, required_level FROM role_skills WHERE role_id = ?", conn, params=(rid,))
        ed = st.data_editor(df, num_rows="dynamic", key=f"rs_ed{rid}", width="stretch", column_config={
            "skill_id": skill_col, "weight": st.column_config.NumberColumn(min_value=1, max_value=3, required=True),
            "required_level": st.column_config.NumberColumn(min_value=1, max_value=5, required=True)})
        if st.button("Save role skills"):
            conn.execute("DELETE FROM role_skills WHERE role_id = ?", (rid,))
            for r in ed.dropna(subset=["skill_id"]).drop_duplicates("skill_id").itertuples():
                conn.execute("INSERT INTO role_skills VALUES (?, ?, ?, ?)", (rid, r.skill_id, int(r.weight), int(r.required_level)))
            conn.commit()
            st.success("Saved.")
        with st.form("new_role"):
            t = st.text_input("New role title")
            d = st.text_input("Description")
            if st.form_submit_button("Add role") and t.strip():
                conn.execute("INSERT OR IGNORE INTO roles (title, description) VALUES (?, ?)", (t.strip(), d))
                conn.commit()
                st.rerun()
    with tabs[5]:
        users = pd.read_sql_query("SELECT u.id, u.name, u.email, u.role, u.last_active, sp.mentor_id FROM users u "
                                  "LEFT JOIN student_profiles sp ON sp.user_id = u.id ORDER BY u.role, u.name", conn)
        mentors = {r["id"]: r["name"] for r in conn.execute("SELECT id, name FROM users WHERE role = 'mentor'")}
        ed = st.data_editor(users, key="users_ed", width="stretch", disabled=["id", "name", "email", "last_active"],
                            column_config={"role": st.column_config.SelectboxColumn(options=["student", "mentor", "admin"]),
                                           "mentor_id": st.column_config.SelectboxColumn(
                                               "mentor_id", options=list(mentors),
                                               help=", ".join(f"{k}={v}" for k, v in mentors.items()))})
        if st.button("Save users"):
            for r in ed.itertuples():
                conn.execute("UPDATE users SET role = ? WHERE id = ?", (r.role, int(r.id)))
                if r.role == "student":
                    conn.execute("INSERT OR IGNORE INTO student_profiles (user_id) VALUES (?)", (int(r.id),))
                    conn.execute("UPDATE student_profiles SET mentor_id = ? WHERE user_id = ?",
                                 (None if pd.isna(r.mentor_id) else int(r.mentor_id), int(r.id)))
            conn.commit()
            st.success("Saved.")
    with tabs[6]:
        q = lambda sql: conn.execute(sql).fetchone()[0]  # noqa: E731
        c = st.columns(5)
        c[0].metric("Students", q("SELECT COUNT(*) FROM users WHERE role = 'student'"))
        c[1].metric("Active paths", q("SELECT COUNT(*) FROM learning_paths WHERE status = 'active'"))
        c[2].metric("Quiz attempts", q("SELECT COUNT(*) FROM quiz_attempts"))
        c[3].metric("Avg quiz score", f"{q('SELECT COALESCE(AVG(score), 0) FROM quiz_attempts'):.0f}%")
        c[4].metric("Resources", q("SELECT COUNT(*) FROM resources"))
        st.subheader("Feedback received")
        st.dataframe(pd.read_sql_query("SELECT value, COUNT(*) AS n FROM feedback GROUP BY value", conn), hide_index=True)
        st.subheader("Recent recommendation log")
        st.dataframe(pd.read_sql_query("SELECT * FROM recommendation_log ORDER BY id DESC LIMIT 50", conn),
                     hide_index=True, width="stretch")


# ---------- router ----------

PAGES = {
    "student": {"Dashboard": student_dashboard, "My profile": profile_page, "Resume upload": resume_page,
                "Skill gap": gap_page, "Learning path": path_page, "Quizzes": quiz_page,
                "Portfolio": portfolio_page, "Account": account_page},
    "mentor": {"My students": mentor_page, "Account": account_page},
    "admin": {"Admin": admin_page, "Account": account_page},
}


def main():
    user = current_user()
    if not user:
        login_page()
        return
    fresh = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not fresh:
        st.session_state.clear()
        st.rerun()
    user = dict(fresh)
    with st.sidebar:
        st.markdown(f"### 🎯 SkillPath AI\n**{user['name']}** · {user['role']}")
        page = st.radio("Go to", list(PAGES[user["role"]]), label_visibility="collapsed")
        if st.button("Log out"):
            st.session_state.clear()
            st.rerun()
    PAGES[user["role"]][page](user)
    if not st.session_state.get("touched"):
        st.session_state.touched = True
        db.touch(conn, user["id"])


main()
