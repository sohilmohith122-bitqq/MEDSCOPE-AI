# .pg/push-both.ps1
# Push this repo's `main` to both GitHub remotes.
# Requires a GitHub credential with WRITE access to samith15-ai's repos
# (the cached credential is for sohilmohith122-bitqq and currently gets 403).
#
# If push fails with "Permission ... denied to <user>" or "error: 403",
# do ONE of these first:
#   A) Sign in as samith15-ai:
#        cmd /c "cmdkey /delete:LegacyGeneric:target=git:https://github.com"
#        then run this script again and complete the browser sign-in.
#   B) Add the current account as a collaborator (Write) on both repos:
#        GitHub -> repo -> Settings -> Collaborators -> Add people.
#   C) Use a one-off PAT (repo scope) without touching the stored credential:
#        $env:GIT_TOKEN = "<paste-token>"
#        then run: powershell -File .pg/push-both.ps1 -Token $env:GIT_TOKEN
#
param(
  [string]$Token = "",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Continue"
$env:GIT_TERMINAL_PROMPT = "0"

$remotes = @(
  @{ name = "origin";    url = "https://github.com/samith15-ai/MEDSCOPE-AI.git"  },
  @{ name = "medscope2"; url = "https://github.com/samith15-ai/MEDSCOPE-AI-.git" }
)

Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host ("Repo: {0}" -f (Get-Location).Path) -ForegroundColor Cyan
Write-Host ("Branch: {0} @ {1}" -f $Branch, (git rev-parse --short HEAD)) -ForegroundColor Cyan

# make sure each remote exists
foreach ($r in $remotes) {
  $existing = git remote get-url $r.name 2>$null
  if (-not $existing) {
    git remote add $r.name $r.url | Out-Null
    Write-Host ("added remote {0} -> {1}" -f $r.name, $r.url)
  } elseif ($existing -ne $r.url) {
    git remote set-url $r.name $r.url | Out-Null
    Write-Host ("updated remote {0} -> {1}" -f $r.name, $r.url)
  }
}

if ($Token) {
  Write-Host "Using supplied token (not stored)." -ForegroundColor Yellow
}

$grandFail = 0
foreach ($r in $remotes) {
  Write-Host ("`n=== pushing to {0} ({1}) ===" -f $r.name, $r.url) -ForegroundColor Cyan
  if ($Token) {
    $target = "https://{0}@github.com/{1}" -f $Token, $r.url.Substring(19)
    git push $target "${Branch}:${Branch}"
  } else {
    git push -u $r.name $Branch
  }
  if ($LASTEXITCODE -eq 0) {
    Write-Host ("OK  {0}" -f $r.name) -ForegroundColor Green
  } else {
    Write-Host ("FAILED {0} (exit {1}) - see hint at the top of this script" -f $r.name, $LASTEXITCODE) -ForegroundColor Red
    $grandFail = 1
  }
}

Write-Host ""
if ($grandFail -eq 0) { Write-Host "DONE - both remotes updated." -ForegroundColor Green }
else { Write-Host "DONE with failures - fix credentials and re-run." -ForegroundColor Yellow }
exit $grandFail