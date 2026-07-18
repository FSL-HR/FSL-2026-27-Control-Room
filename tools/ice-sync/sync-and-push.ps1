# FSL ice auto-sync wrapper.
# Reads the ICE ALLOCATION BIBLE, regenerates ice-allocation.json, and commits + pushes
# ONLY when the ice content actually changed (added/removed slots) — not on every run.
# Used by the "FSL Ice Sync" scheduled task (12pm & 8pm) and the "Sync Ice Now" desktop shortcut.
$ErrorActionPreference = 'Stop'

$repo  = 'C:\Users\hrunnalls\OneDrive - Silent Ice Inc. - Female Super League\Laptop\Desktop\Hammie_Test\FSL-2026-27-Control-Room'
$bible = 'C:\Users\hrunnalls\Silent Ice Inc. - Female Super League\Silent Ice Inc. - Female Super League - Documents\1. 2026-27 Season\Ice Scheduling\ICE ALLOCATION BIBLE.xlsx'
$tool  = Join-Path $repo 'tools\ice-sync'
$log   = Join-Path $tool 'sync.log'
function Log($m){ "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" | Tee-Object -FilePath $log -Append | Out-Null }

try {
  Set-Location $repo
  if (-not (Test-Path (Join-Path $tool 'node_modules'))) { Log 'Installing xlsx dependency...'; Push-Location $tool; npm install --silent; Pop-Location }
  if (-not (Test-Path $bible)) { Log "Bible not found (SharePoint may be offline): $bible"; exit 0 }

  $stamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
  $out = & node (Join-Path $tool 'sync-ice.js') $bible (Join-Path $repo 'ice-allocation.json') $stamp 2>&1
  $out | ForEach-Object { Log $_ }

  if ($out -match 'CONTENT_CHANGED=yes') {
    git add ice-allocation.json | Out-Null
    git commit -m "chore(ice): auto-sync from Bible ($stamp)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" | Out-Null
    git push origin HEAD | Out-Null
    Log 'Ice changed -> committed & pushed.'
  } else {
    # Discard the timestamp-only rewrite so the working tree stays clean.
    git checkout -- ice-allocation.json 2>$null
    Log 'No ice content change -> nothing to commit.'
  }
} catch {
  Log "ERROR: $_"
  exit 1
}
