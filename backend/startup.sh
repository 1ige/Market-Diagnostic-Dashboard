#!/bin/bash
set -e

echo "🌱 Seeding indicators..."
python /app/seed_indicators.py

echo "🚀 Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
