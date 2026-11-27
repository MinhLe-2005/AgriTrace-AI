try { $Host.UI.RawUI.WindowTitle = 'AgriTrace-Frontend' } catch {}
Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AgriTrace Frontend Next.js (Port 3000)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

npm run dev
