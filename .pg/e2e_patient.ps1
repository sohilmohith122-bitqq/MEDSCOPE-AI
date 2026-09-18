$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3001'
function J($o) { $o | ConvertTo-Json -Depth 6 -Compress }

Write-Host '=== UNAUTH GUARDS ==='
foreach ($p in @('/api/timeline','/api/events','/api/documents','/api/share','/api/audit','/api/snapshots')) {
  try { $r = Invoke-WebRequest -Uri "$base$p" -UseBasicParsing -TimeoutSec 20; Write-Host "$p -> $($r.StatusCode)" }
  catch { Write-Host "$p -> $([int]$_.Exception.Response.StatusCode)" }
}

Write-Host ''
Write-Host '=== PATIENT SIGNIN ==='
$ps = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/signin" -Method POST -Body (J @{email='patient@demo.medcare';password='demo1234'}) -ContentType 'application/json' -WebSession $ps -UseBasicParsing -TimeoutSec 25
  Write-Host "signin -> $($r.StatusCode)"
} catch { Write-Host "signin FAILED: $($_.Exception.Message)" }

Write-Host ''
Write-Host '=== PATIENT READS ==='
try {
  $r = Invoke-WebRequest -Uri "$base/api/timeline" -WebSession $ps -UseBasicParsing -TimeoutSec 25
  $t = $r.Content | ConvertFrom-Json
  Write-Host "timeline -> $($r.StatusCode) events=$($t.events.Count) episodes=$($t.episodes.Count) relationships=$($t.relationships.Count)"
  Write-Host "  first: $($t.events[0].title) | $($t.events[0].datePrecision) | $($t.events[0].evidenceStatus)"
} catch { Write-Host "timeline FAILED: $($_.Exception.Message)" }

try {
  $r = Invoke-WebRequest -Uri "$base/api/documents" -WebSession $ps -UseBasicParsing -TimeoutSec 25
  $d = $r.Content | ConvertFrom-Json
  Write-Host "documents -> $($r.StatusCode) count=$($d.documents.Count)"
  Write-Host "  summary: $($d.summary)"
} catch { Write-Host "documents FAILED: $($_.Exception.Message)" }

try {
  $r = Invoke-WebRequest -Uri "$base/api/snapshots" -WebSession $ps -UseBasicParsing -TimeoutSec 25
  $s = $r.Content | ConvertFrom-Json
  Write-Host "snapshots -> $($r.StatusCode)"
} catch { Write-Host "snapshots -> $([int]$_.Exception.Response.StatusCode)" }

Write-Host ''
Write-Host '=== GROUNDED CHAT ==='
foreach ($q in @('Show medication history','Show conflicts','What changed recently?','Should I stop my medication?')) {
  try {
    $r = Invoke-WebRequest -Uri "$base/api/chat" -Method POST -Body (J @{question=$q}) -ContentType 'application/json' -WebSession $ps -UseBasicParsing -TimeoutSec 25
    $c = $r.Content | ConvertFrom-Json
    Write-Host "Q: $q"
    Write-Host "  A: $($c.answer.Substring(0, [Math]::Min(140, $c.answer.Length)))"
    Write-Host "  citations=$($c.citations.Count)"
  } catch { Write-Host "Q: $q -> FAILED $($_.Exception.Message)" }
}

Write-Host ''
Write-Host '=== SHARE CREATE ==='
try {
  $r = Invoke-WebRequest -Uri "$base/api/share" -Method POST -Body (J @{scopes=@('TIMELINE','MEDICATIONS');permission='VIEW_ONLY';expiresIn='24h';documentIds=@()}) -ContentType 'application/json' -WebSession $ps -UseBasicParsing -TimeoutSec 25
  $sh = $r.Content | ConvertFrom-Json
  Write-Host "share -> $($r.StatusCode) url=$($sh.shareUrl)"
  $script:shareId = $sh.id
  $script:shareToken = $sh.token
  $tok = $sh.token
  Write-Host '--- share landing page (no session) ---'
  $r2 = Invoke-WebRequest -Uri "$base/share/$tok" -UseBasicParsing -TimeoutSec 25
  Write-Host "GET /share/<token> -> $($r2.StatusCode) len=$($r2.Content.Length)"
} catch { Write-Host "share FAILED: $($_.Exception.Message)" }

Write-Host ''
Write-Host '=== IDOR: patient reading another patient id ==='
try {
  $r = Invoke-WebRequest -Uri "$base/api/timeline?patientId=someone-elses-id" -WebSession $ps -UseBasicParsing -TimeoutSec 25
  Write-Host "timeline?patientId=other -> $($r.StatusCode) (should be patient-scoped, not another patient)"
} catch { Write-Host "timeline?patientId=other -> $([int]$_.Exception.Response.StatusCode)" }
