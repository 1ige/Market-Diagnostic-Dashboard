#!/usr/bin/env pwsh
# Market Diagnostic Dashboard Launcher
# This script starts all containers and loads indicator data

Write-Host "🚀 Market Diagnostic Dashboard Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "⏳ Waiting for Docker to start (this may take 15-30 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Wait for Docker to be ready
    $maxAttempts = 10
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        try {
            docker ps | Out-Null
            Write-Host "✅ Docker is ready!" -ForegroundColor Green
            break
        } catch {
            $attempt++
            if ($attempt -eq $maxAttempts) {
                Write-Host "❌ Docker failed to start. Please start Docker Desktop manually and try again." -ForegroundColor Red
                exit 1
            }
            Start-Sleep -Seconds 3
        }
    }
}

Write-Host ""
Write-Host "🏗️  Building and starting containers..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "📊 Triggering data backfill..." -ForegroundColor Yellow
$backfillResponse = curl -X POST http://localhost:8000/admin/backfill -UseBasicParsing 2>$null
if ($backfillResponse) {
    $backfillData = $backfillResponse.Content | ConvertFrom-Json
    Write-Host "✅ Backfill complete: $($backfillData.success_count)/$($backfillData.total_count) indicators loaded" -ForegroundColor Green
    Write-Host "   Total datapoints: $($backfillData.total_datapoints)" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Could not trigger backfill automatically. You may need to run:" -ForegroundColor Yellow
    Write-Host "   curl -X POST http://localhost:8000/admin/backfill" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Market Diagnostic Dashboard is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Services available at:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Database:  http://localhost:8080 (Adminer)" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all services, run:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening dashboard in browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
