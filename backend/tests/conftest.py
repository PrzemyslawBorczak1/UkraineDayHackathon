import os
import pathlib
import sys

# These unit tests never touch the database. Point the engine at sqlite so
# importing app.database doesn't require the psycopg driver to be installed.
os.environ.setdefault("DATABASE_URL", "sqlite://")

# Make the `app` package importable when running pytest from anywhere.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
