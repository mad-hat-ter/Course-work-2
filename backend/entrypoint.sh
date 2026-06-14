#!/bin/sh
set -e

cd /app/backend

echo "Applying migrations..."
alembic upgrade head

echo "Seeding database..."
python -m backend.app.db.seed

echo "Starting API..."
cd /app
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
