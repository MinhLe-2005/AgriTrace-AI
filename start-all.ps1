# ===================================================================
# AgriTrace AI - Local Quick Start Script (PowerShell)
# Khoi dong toan bo he thong: PostgreSQL + Spring Boot + Next.js
# ===================================================================

$RepoRoot = $PSScriptRoot
if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🌿 AgriTrace AI - Khoi Dong He Thong Phat Trien Local" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Kiem tra & Khoi dong PostgreSQL (Port 5432)
Write-Host "`n[1/3] Kiem tra Database PostgreSQL (port 5432)..." -ForegroundColor Yellow
$pgListening = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($pgListening) {
    Write-Host "  -> PostgreSQL dang chay tren port 5432 (San sang)." -ForegroundColor Green
} else {
    # Thu khoi dong portable postgres neu co tai d:\pgsql
    $pgPortable = "d:\pgsql\bin\postgres.exe"
    $pgData = "d:\pgsql\data"
    if (Test-Path $pgPortable -PathType Leaf) {
        Write-Host "  -> Khoi dong PostgreSQL portable tu $pgPortable..." -ForegroundColor Cyan
        Start-Process $pgPortable -ArgumentList "-D `"$pgData`"" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  -> Luu y: Vui long bat PostgreSQL service (Port 5432) hoac chay 'docker compose up -d postgres'." -ForegroundColor Magenta
    }
}

# 2. Khoi dong Backend Spring Boot (Port 8080)
Write-Host "`n[2/3] Khoi dong Backend Spring Boot (port 8080)..." -ForegroundColor Yellow
$BackendDir = Join-Path $RepoRoot "backend"

# Tim Maven executable tren he thong
$mvnCmd = "mvn"
if (-not (Get-Command "mvn" -ErrorAction SilentlyContinue)) {
    # Thu tim trong user wrapper
    $m2Wrapper = Get-ChildItem -Path "$env:USERPROFILE\.m2\wrapper\dists" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($m2Wrapper) {
        $mvnCmd = $m2Wrapper.FullName
    } else {
        $mvnCmd = "mvn.cmd"
    }
}

Write-Host "  -> Su dung Maven: $mvnCmd" -ForegroundColor Gray
Start-Process $mvnCmd -ArgumentList "spring-boot:run `"-Dspring-boot.run.profiles=dev`"" -WorkingDirectory $BackendDir

# 3. Khoi dong Frontend Next.js (Port 3000)
Write-Host "`n[3/3] Khoi dong Frontend Next.js (port 3000)..." -ForegroundColor Yellow
$FrontendDir = Join-Path $RepoRoot "frontend"
Start-Process "npm.cmd" -ArgumentList "run dev" -WorkingDirectory $FrontendDir

# Thong bao hoan tat
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   🎉 Toan bo he thong da duoc khoi dong thanh cong!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " - Frontend UI:   http://localhost:3000" -ForegroundColor Yellow
Write-Host " - Backend API:   http://localhost:8080" -ForegroundColor Yellow
Write-Host " - Swagger UI:    http://localhost:8080/swagger-ui/index.html" -ForegroundColor Yellow
Write-Host " - Health Actuator: http://localhost:8080/actuator/health" -ForegroundColor Yellow
Write-Host " - Database:      localhost:5432 (Database: my_fullstack_app)" -ForegroundColor Yellow
Write-Host "==========================================================`n" -ForegroundColor Cyan
