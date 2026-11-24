try { $Host.UI.RawUI.WindowTitle = 'AgriTrace-Backend' } catch {}
Set-Location $PSScriptRoot

# Set JAVA_HOME
if (-not $env:JAVA_HOME) {
    $javaCandidates = @(
        "C:\Program Files\Java\jdk-24",
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\Java\jdk-17"
    )
    foreach ($cand in $javaCandidates) {
        if (Test-Path $cand) {
            $env:JAVA_HOME = $cand
            $env:Path = "$cand\bin;" + $env:Path
            break
        }
    }
}

# Load .env
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        $l = $_.Trim()
        if ($l -and -not $l.StartsWith('#')) {
            $p = $l.Split('=', 2)
            if ($p.Length -eq 2) {
                [System.Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim(), 'Process')
            }
        }
    }
}

$env:SPRING_PROFILES_ACTIVE = 'dev'

# Find Maven
$mvnCmd = "mvn.cmd"
$foundMvn = Get-Command "mvn.cmd", "mvn" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($foundMvn) {
    $mvnCmd = $foundMvn.Source
} else {
    $m2Wrapper = Get-ChildItem -Path "$env:USERPROFILE\.m2\wrapper\dists", "C:\Users\Admin\Downloads" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Sort-Object -Descending FullName | Select-Object -First 1
    if ($m2Wrapper) {
        $mvnCmd = $m2Wrapper.FullName
    } else {
        $ideaMaven = Get-ChildItem -Path "C:\Program Files\JetBrains" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($ideaMaven) {
            $mvnCmd = $ideaMaven.FullName
        }
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AgriTrace Backend Spring Boot (Port 8080)" -ForegroundColor Green
Write-Host "  JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
Write-Host "  Maven:     $mvnCmd" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

& "$mvnCmd" spring-boot:run '-Dspring-boot.run.profiles=dev'
