# Credits, reused work and data sources

As the project brief asked, we looked for existing projects to reuse before writing code. This is what we reused and where it came from.

## Code and design reused

| Source | Used for | Licence |
| --- | --- | --- |
| [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template) | Backend structure (`app/core`, `app/api/deps.py`, routers), pydantic-settings configuration, JWT + bcrypt security helpers, SQLAlchemy session dependency, Alembic setup, Dockerfile pattern. Adapted to SQLAlchemy 2.0 typed models and our domain. | MIT |
| **Lumora** frontend by Nidhi (Member 1) | React design system, public and auth pages, service layer, contexts. Extended with the remaining app pages. | Team work |
| [Spidy20/Smart_Resume_Analyser_App](https://github.com/Spidy20/Smart_Resume_Analyser_App) | Inspiration for the Sprint 1 prototype flow (resume → skills → courses). No code copied. | No licence published |

## Data

| Source | Used for | Licence / terms |
| --- | --- | --- |
| [O*NET 31.0 Database](https://www.onetcenter.org/database.html) | Role → required technology skills (trimmed to 9 roles) | CC BY 4.0. This product includes information from O*NET, U.S. Department of Labor, Employment and Training Administration |
| [roadmap.sh / developer-roadmap](https://github.com/kamranahmedse/developer-roadmap) | Reference for skill order (prerequisite graph). Content not copied. | See repository licence |
| [Coursera course datasets on Kaggle](https://baselight.app/u/kaggle/dataset/yasirabdaali_coursera_free_courses_dataset) | Reference for course fields (skills, level, rating) | See each dataset's licence |
| Course providers linked in the catalogue (MDN, freeCodeCamp, Kaggle Learn, Coursera, Google, Microsoft Learn, AWS, Cisco NetAcad, fast.ai, Hugging Face and others) | Links to public course pages | Content belongs to each provider |

Hours, costs and ratings in the seed catalogue are approximate and can be edited by an admin (`/resources` API).

## Libraries

FastAPI, SQLAlchemy, Alembic, pydantic, PyJWT, bcrypt, pandas, NumPy, pytest (backend); React, Vite, Tailwind CSS, react-router, recharts, axios, lucide-react (frontend). Each is used under its own open-source licence.
