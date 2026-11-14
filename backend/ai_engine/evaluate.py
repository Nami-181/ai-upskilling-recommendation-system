"""Offline evaluation of the recommendation engine on labelled sample profiles.

Run:  python -m ai_engine.evaluate        (from the backend/ folder)

Metrics
  precision@3     share of the engine's top-3 ranked gaps that a reviewer also listed
  prereq_valid    every module appears after the prerequisites that are also in the path
  level_fit       share of recommended resources within one level of the target difficulty
  complete_ok     profiles with no expected gaps get an empty path and 100 % readiness
"""
from __future__ import annotations

import json
from pathlib import Path

from .catalog import DATA_DIR, Catalog
from .planner import build_learning_path


def evaluate(catalog: Catalog | None = None, profiles_path: Path = DATA_DIR / "sample_profiles.json") -> dict:
    catalog = catalog or Catalog.from_csv()
    profiles = json.loads(Path(profiles_path).read_text(encoding="utf-8"))
    prereqs = catalog.prereq_map()
    rows = []
    for p in profiles:
        plan = build_learning_path(catalog, p["levels"], p["role_id"], hours_per_week=8)
        top = [r["skill_id"] for r in plan["gap"]["rows"] if r["gap"] > 0][:3]
        expected = set(p["expected_top_gaps"])
        precision = (len(set(top) & expected) / len(top)) if top else (1.0 if not expected else 0.0)
        position = {m["skill_id"]: m["order_no"] for m in plan["modules"]}
        prereq_valid = all(position[pre] < position[s] for s in position for pre in prereqs.get(s, [])
                           if pre in position)
        fits = [abs(int(r["level"]) - int(r["target_level"])) <= 1 for m in plan["modules"] for r in m["resources"]]
        rows.append({"id": p["id"], "role": p["role_id"], "readiness": plan["readiness"], "top3": top,
                     "expected": sorted(expected), "precision_at_3": round(precision, 2),
                     "prereq_valid": prereq_valid, "level_fit": round(sum(fits) / len(fits), 2) if fits else 1.0,
                     "modules": len(plan["modules"])})
    n = len(rows)
    summary = {
        "profiles": n,
        "mean_precision_at_3": round(sum(r["precision_at_3"] for r in rows) / n, 3),
        "prereq_valid_rate": round(sum(r["prereq_valid"] for r in rows) / n, 3),
        "mean_level_fit": round(sum(r["level_fit"] for r in rows) / n, 3),
    }
    return {"summary": summary, "profiles": rows}


def main():
    result = evaluate()
    for r in result["profiles"]:
        print(f"{r['id']:4} {r['role']:28} ready {r['readiness']:5.1f}%  P@3 {r['precision_at_3']:.2f}  "
              f"prereq {'ok' if r['prereq_valid'] else 'FAIL'}  fit {r['level_fit']:.2f}  top3 {r['top3']}")
    print(json.dumps(result["summary"], indent=2))


if __name__ == "__main__":
    main()
