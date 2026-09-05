"""CampusFlow FastAPI entrypoint proxy for `app.main` compatibility.

Re-exports `app` from `main.py` so that both:
- `uvicorn main:app --reload`
- `uvicorn app.main:app --reload`
work seamlessly from the backend directory or project root.
"""
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app

__all__ = ["app"]
