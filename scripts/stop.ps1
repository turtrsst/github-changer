# Hentikan server GitHub Changer yang jalan di background (atau yang memegang port 4173).
$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pidFile = Join-Path $root 'data\server.pid'
$port = if ($env:PORT) { [int]$env:PORT } else { 4173 }
$stopped = 0

if (Test-Path $pidFile) {
    $pidValue = (Get-Content $pidFile -Raw).Trim()
    if ($pidValue -match '^\d+$') {
        $proc = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
        if ($proc) { Stop-Process -Id ([int]$pidValue) -Force; $stopped += 1; Write-Host "PID $pidValue dihentikan." }
    }
    Remove-Item $pidFile -Force
}

# Fallback: siapa pun yang masih memegang port 4173
Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $owner = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($owner) { Stop-Process -Id $owner.Id -Force; $stopped += 1; Write-Host "Proses $($owner.ProcessName) (PID $($owner.Id)) di port $port dihentikan." }
}

if ($stopped -eq 0) { Write-Host "Tidak ada server yang berjalan di port $port." }
else { Write-Host "Selesai. $stopped proses dihentikan." }
