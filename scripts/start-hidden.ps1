# Jalankan GitHub Changer di background (tanpa jendela terminal yang harus dibuka).
# Usage: powershell -ExecutionPolicy Bypass -File scripts\start-hidden.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$data = Join-Path $root 'data'
New-Item -ItemType Directory -Force -Path $data | Out-Null
$pidFile = Join-Path $data 'server.pid'

if (Test-Path $pidFile) {
    $oldPid = (Get-Content $pidFile -Raw).Trim()
    if ($oldPid -match '^\d+$' -and (Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue)) {
        Write-Host "Server sudah berjalan (PID $oldPid). Gunakan scripts\stop.ps1 untuk menghentikan."
        exit 0
    }
}

if (-not $env:HOST) { $env:HOST = '127.0.0.1' }
if (-not $env:PORT) { $env:PORT = '4173' }
$node = (Get-Command node -ErrorAction Stop).Source

$proc = Start-Process -FilePath $node `
    -ArgumentList 'server/index.js' `
    -WorkingDirectory $root `
    -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $data 'server.log') `
    -RedirectStandardError (Join-Path $data 'server.err.log')

Set-Content -Path $pidFile -Value $proc.Id -NoNewline
Write-Host "GitHub Changer jalan di background (PID $($proc.Id)) -> http://$($env:HOST):$($env:PORT)"
Write-Host "Log: $data\server.log  |  Error: $data\server.err.log"
Write-Host "Hentikan dengan: powershell -ExecutionPolicy Bypass -File scripts\stop.ps1"
