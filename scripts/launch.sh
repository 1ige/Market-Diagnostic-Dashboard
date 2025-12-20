#!/bin/bash
# Market Diagnostic Dashboard Launcher
# This script starts all containers and loads indicator data

set -e

echo "🚀 Market Diagnostic Dashboard Launcher"
echo "========================================"
echo ""

# Check if Docker is running
echo "🔍 Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi
echo "✅ Docker is running"

echo ""
echo "🏗️  Building and starting containers..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 8

echo ""
echo "📊 Triggering data backfill..."
if backfill_response=$(curl -s -X POST http://localhost:8000/admin/backfill); then
    success_count=$(echo "$backfill_response" | grep -o '"success_count":[0-9]*' | cut -d':' -f2)
    total_count=$(echo "$backfill_response" | grep -o '"total_count":[0-9]*' | cut -d':' -f2)
    total_datapoints=$(echo "$backfill_response" | grep -o '"total_datapoints":[0-9]*' | cut -d':' -f2)
    echo "✅ Backfill complete: $success_count/$total_count indicators loaded"
    echo "   Total datapoints: $total_datapoints"
else
    echo "⚠️  Could not trigger backfill automatically. You may need to run:"
    echo "   curl -X POST http://localhost:8000/admin/backfill"
fi

echo ""
echo "========================================"
echo "✅ Market Diagnostic Dashboard is ready!"
echo ""
echo "📱 Services available at:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   Database:  http://localhost:8080 (Adminer)"
echo ""
echo "🛑 To stop all services, run:"
echo "   docker-compose down"
echo ""

# Try to open browser (works on most systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173 > /dev/null 2>&1 &
elif command -v open > /dev/null; then
    open http://localhost:5173
fi
