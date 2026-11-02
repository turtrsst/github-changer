# Buka Cloudflare Tunnel supaya webhook GitHub bisa menjangkau app LOKAL
# (http://127.0.0.1:4173) tanpa port-forwarding / IP publik.
#
# Mode "quick": TANPA login Cloudflare, dapat URL acak https://xxx.trycloudflare.com
# Mode "named": pakai tunnel yang sudah dibuat (cloudflared tunnel create kra)
#              + DNS record CNAME ke <UUID>.cfargotunnel.com di Cloudflare.
#              Contoh config 3 hostname (KRA/N100N/GitHub Changer):
#              config/cloudflared-kra.yml.example
#
# Untuk port selain 4173: -Port 8088 (KRA PHP) atau -Port 5679 (N100N).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1 -Mode named -TunnelName kra
param(
    [ValidateSet('quick', 'named')][string]$Mode = 'quick',
    [string]$TunnelName = 'kra',
    # 4173 = GitHub Changer (webhook), 8088 = KRA PHP, 5679 = N100N
    [int]$Port = 4173,
    [string]$ConfigPath = (Join-Path $env:USERPROFILE '.cloudflared\config.yml')
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$data = Join-Path $root 'data'
New-Item -ItemType Directory -Force -Path $data | Out-Null
$log = Join-Path $data 'cloudflared.log'

$cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cmd) {
    Write-Host 'cloudflared belum terinstal.' -ForegroundColor Yellow
    Write-Host 'Instal: winget install --id Cloudflare.cloudflared'
    Write-Host 'Atau unduh: https://github.com/cloudflare/cloudflared/releases/latest'
    exit 1
}

Remove-Item $log -Force -ErrorAction SilentlyContinue
if ($Mode -eq 'quick') {
    $args = @('tunnel', '--url', "http://127.0.0.1:$Port", '--logfile', $log)
    Write-Host "Mode quick meneruskan port $Port (4173=webhook app, 8088=KRA PHP, 5679=N100N)."
} else {
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "Config belum ada: $ConfigPath" -ForegroundColor Yellow
        Write-Host 'Contoh siap pakai: config\cloudflared-kra.yml.example'
        exit 1
    }
    $args = @('tunnel', '--config', $ConfigPath, '--logfile', $log, 'run', $TunnelName)
}

$proc = Start-Process -FilePath $cmd.Source -ArgumentList $args -WorkingDirectory $root `
    -WindowStyle Hidden -PassThru
$proc.Id | Set-Content (Join-Path $data 'cloudflared.pid') -NoNewline
Write-Host "cloudflared jalan (PID $($proc.Id)) · mode $Mode"

if ($Mode -eq 'quick') {
    $url = $null
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $log) {
            $match = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -Last 1
            if ($match) { $url = $match.Matches[0].Value; break }
        }
    }
    if ($url) {
        Write-Host ''
        Write-Host "URL publik : $url" -ForegroundColor Green
        Write-Host "Webhook URL: $url/webhook/github" -ForegroundColor Cyan
        Write-Host 'Tempel URL itu di GitHub → Settings → Webhooks → Payload URL.'
        Write-Host 'Catatan: URL quick tunnel BERUBAH tiap restart. Untuk permanen pakai -Mode named.'
    } else {
        Write-Host "URL belum muncul. Cek log: $log" -ForegroundColor Yellow
    }
} else {
    Write-Host "Tunnel '$TunnelName' aktif."
    Write-Host 'KRA        : https://kantor-rama-ai.my.id'
    Write-Host 'N100N      : https://automation.kantor-rama-ai.my.id'
    Write-Host 'Webhook    : https://ghc.kantor-rama-ai.my.id/webhook/github' -ForegroundColor Cyan
}
Write-Host "Log: $log"
Write-Host 'Hentikan: Stop-Process -Id (Get-Content data\cloudflared.pid) -Force'
