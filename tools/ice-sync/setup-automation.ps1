# One-time setup for FSL ice automation (run once, as the normal user — no admin needed):
#   - Registers a "FSL Ice Sync" scheduled task that runs the sync at 12:00pm and 8:00pm daily.
#   - Creates a "Sync Ice Now" desktop shortcut for on-demand runs.
# Re-run any time to update; use the removal lines at the bottom to undo.
$ErrorActionPreference = 'Stop'

$tool    = 'C:\Users\hrunnalls\OneDrive - Silent Ice Inc. - Female Super League\Laptop\Desktop\Hammie_Test\FSL-2026-27-Control-Room\tools\ice-sync'
$wrapper = Join-Path $tool 'sync-and-push.ps1'
$pwsh    = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$args    = "-NoProfile -ExecutionPolicy Bypass -File `"$wrapper`""

# --- Scheduled task: 12:00 and 20:00 daily ---
$action   = New-ScheduledTaskAction -Execute $pwsh -Argument $args
$trigNoon = New-ScheduledTaskTrigger -Daily -At 12:00PM
$trigEve  = New-ScheduledTaskTrigger -Daily -At 8:00PM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName 'FSL Ice Sync' -Action $action -Trigger $trigNoon,$trigEve `
  -Settings $settings -Description 'Sync ICE ALLOCATION BIBLE -> ice-allocation.json (12pm & 8pm daily)' -Force | Out-Null
Write-Host 'Registered scheduled task "FSL Ice Sync" (runs 12:00 PM and 8:00 PM daily).'

# --- Desktop shortcut: "Sync Ice Now" ---
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'Sync Ice Now.lnk'
$wsh = New-Object -ComObject WScript.Shell
$sc  = $wsh.CreateShortcut($lnkPath)
$sc.TargetPath       = $pwsh
$sc.Arguments        = $args
$sc.WorkingDirectory = $tool
$sc.Description       = 'Sync ice from the ICE ALLOCATION BIBLE now'
$sc.Save()
Write-Host "Created desktop shortcut: $lnkPath"

Write-Host ''
Write-Host 'To remove later:'
Write-Host '  Unregister-ScheduledTask -TaskName "FSL Ice Sync" -Confirm:$false'
Write-Host ('  Remove-Item "{0}"' -f $lnkPath)
