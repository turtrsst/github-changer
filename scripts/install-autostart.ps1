# Pasang Task Scheduler supaya GitHub Changer otomatis jalan setiap Windows login.
# Jalankan sekali saja. Kalau ditolak, buka PowerShell sebagai Administrator.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$script = Join-Path $root 'scripts\start-hidden.ps1'
$taskName = 'GitHub Changer'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
    -Description 'Dashboard Git & GitHub lokal (GitHub Changer) - auto start saat login' -Force | Out-Null

Write-Host "Task '$taskName' terpasang. Server akan otomatis jalan tiap login."
Write-Host "Jalankan sekarang juga: Start-ScheduledTask -TaskName '$taskName'"
Write-Host "Cek status:            Get-ScheduledTask -TaskName '$taskName' | Select-Object State"
Write-Host "Hapus autostart:       Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
