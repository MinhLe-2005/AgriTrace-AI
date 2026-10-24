# ===================================================================
# AgriTrace AI - Local Quick Start Script (PowerShell)
# Khoi dong toan bo he thong: PostgreSQL (Cloud/Local) + Spring Boot + Next.js
# ===================================================================

$RepoRoot = $PSScriptRoot
if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🌿 AgriTrace AI - Khoi Dong He Thong Phat Trien" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"

# Load backend/.env neu co
$envFile = Join-Path $BackendDir ".env"
if (Test-Path $envFile -PathType Leaf) {
    Write-Host "`n[*] Doc cau hinh tu $envFile..." -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
            }
        }
    }
}

# 1. Kiem tra Database
Write-Host "`n[1/3] Kiem tra Database..." -ForegroundColor Yellow
if ($env:SPRING_DATASOURCE_URL -match "supabase\.com" -or $env:DB_HOST -match "supabase\.com") {
    Write-Host "  -> Dang ket noi Cloud Supabase PostgreSQL: $($env:DB_HOST) (San sang)." -ForegroundColor Green
} else {
    $pgListening = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($pgListening) {
        Write-Host "  -> PostgreSQL Local dang chay tren port 5432 (San sang)." -ForegroundColor Green
    } else {
        $pgPortable = "d:\pgsql\bin\postgres.exe"
        $pgData = "d:\pgsql\data"
        if (Test-Path $pgPortable -PathType Leaf) {
            Write-Host "  -> Khoi dong PostgreSQL portable tu $pgPortable..." -ForegroundColor Cyan
            Start-Process $pgPortable -ArgumentList "-D `"$pgData`"" -WindowStyle Hidden
            Start-Sleep -Seconds 2
        } else {
            Write-Host "  -> Luu y: Vui long bat PostgreSQL service (Port 5432) hoac cau hinh Cloud Supabase." -ForegroundColor Magenta
        }
    }
}

# 2. Khoi dong Backend Spring Boot (Port 8080)
Write-Host "`n[2/3] Khoi dong Backend Spring Boot (port 8080)..." -ForegroundColor Yellow

$mvnCmd = "mvn.cmd"
$foundMvn = Get-Command "mvn.cmd", "mvn" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($foundMvn) {
    $mvnCmd = $foundMvn.Source
} else {
    $m2Wrapper = Get-ChildItem -Path "$env:USERPROFILE\.m2\wrapper\dists" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($m2Wrapper) {
        $mvnCmd = $m2Wrapper.FullName
    } else {
        $ideaMaven = Get-ChildItem -Path "C:\Program Files\JetBrains" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($ideaMaven) {
            $mvnCmd = $ideaMaven.FullName
        }
    }
}

Write-Host "  -> Su dung Maven: $mvnCmd" -ForegroundColor Gray
$bPortListening = Test-NetConnection -ComputerName 127.0.0.1 -Port 8080 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($bPortListening) {
    Write-Host "  -> Port 8080 da dang chay san." -ForegroundColor Green
} else {
    Start-Process "cmd.exe" -ArgumentList "/k title AgriTrace-Backend && `"$mvnCmd`" spring-boot:run `"-Dspring-boot.run.profiles=dev`"" -WorkingDirectory $BackendDir
}

# 3. Khoi dong Frontend Next.js (Port 3000)
Write-Host "`n[3/3] Khoi dong Frontend Next.js (port 3000)..." -ForegroundColor Yellow
$fPortListening = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($fPortListening) {
    Write-Host "  -> Port 3000 da dang chay san." -ForegroundColor Green
} else {
    Start-Process "cmd.exe" -ArgumentList "/k title AgriTrace-Frontend && npm run dev" -WorkingDirectory $FrontendDir
}

# Thong bao hoan tat
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   🎉 Toan bo he thong da duoc khoi dong thanh cong!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " - Frontend UI:      http://localhost:3000" -ForegroundColor Yellow
Write-Host " - Backend API:      http://localhost:8080" -ForegroundColor Yellow
Write-Host " - Swagger UI:       http://localhost:8080/swagger-ui/index.html" -ForegroundColor Yellow
Write-Host " - Health Actuator:  http://localhost:8080/actuator/health" -ForegroundColor Yellow
Write-Host " - Database:         Supabase Cloud PostgreSQL ($($env:DB_HOST))" -ForegroundColor Yellow
Write-Host "==========================================================`n" -ForegroundColor Cyan
