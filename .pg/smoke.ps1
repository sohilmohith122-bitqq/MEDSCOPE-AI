$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3001'
function Line($t) { Write-Output "== $t" }

Line 'UNAUTH guards'
foreach ($p in @('/api/timeline','/api/events','/api/documents','/api/snapshots','/api/audit','/api/share','/api/emergency')) {
  try { $r = Invoke-WebRequest -Uri "$base$p" -UseBasicParsing -TimeoutSec 20; Write-Output "  $p -> $($r.StatusCode)" }
  catch { Write-Output "  $p -> $([int]$_.Exception.Response.StatusCode)" }
}

Line 'PATIENT signin'
$sp = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/signin" -Method POST -WebSession $sp -ContentType 'application/json' -Body (@{email='patient@demo.medcare';password='demo1234'} | ConvertTo-Json) -UseBasicParsing -TimeoutSec 20
  Write-Output "  signin -> $($r.StatusCode)"
} catch { Write-Output "  signin FAILED -> $($_.Exception.Message)" }

Line 'PATIENT authorized reads'
foreach ($p in @('/api/timeline','/api/events','/api/documents','/api/snapshots','/api/share','/api/audit')) {
  try {
    $r = Invoke-WebRequest -Uri "$base$p" -WebSession $sp -UseBasicParsing -TimeoutSec 25
    Write-Output "  $p -> $($r.StatusCode) len=$($r.Content.Length)"
  } catch { Write-Output "  $p -> ERR $($_.Exception.Message)" }
}

Line 'PATIENT timeline sample'
try {
  $t = (Invoke-WebRequest -Uri "$base/api/timeline" -WebSession $sp -UseBasicParsing -TimeoutSec 25).Content | ConvertFrom-Json
  Write-Output "  events=$($t.events.Count)"
  $t.events | Select-Object -First 3 | ForEach-Object { Write-Output "   - [$($_.datePrecision)] $($_.title) | $($_.evidenceStatus)" }
} catch { Write-Output "  ERR $($_.Exception.Message)" }

Line 'PATIENT chat (grounded)'
try {
  $c = (Invoke-WebRequest -Uri "$base/api/chat" -Method POST -WebSession $sp -ContentType 'application/json' -Body (@{question='Show medication history'} | ConvertTo-Json) -UseBasicParsing -TimeoutSec 30).Content | ConvertFrom-Json
  Write-Output "  answer(len)=$($c.answer.Length) events=$($c.events.Count) citations=$($c.citations.Count)"
  Write-Output "  first line: $(($c.answer -split "`n")[0])"
} catch { Write-Output "  ERR $($_.Exception.Message)" }

Line 'PATIENT create share'
$shareToken = $null
try {
  $body = @{ scopes=@('TIMELINE','MEDICATIONS'); permission='VIEW_ONLY'; expiresIn='24h'; documentIds=@() } | ConvertTo-Json
  $s = (Invoke-WebRequest -Uri "$base/api/share" -Method POST -WebSession $sp -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 25).Content | ConvertFrom-Json
  $shareToken = $s.token
  Write-Output "  share created id=$($s.id) tokenLen=$($s.token.Length) expiresAt=$($s.expiresAt)"
} catch { Write-Output "  ERR $($_.Exception.Message)" }

Line 'DOCTOR signin'
$sd = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/signin" -Method POST -WebSession $sd -ContentType 'application/json' -Body (@{email='doctor@demo.medcare';password='demo1234'} | ConvertTo-Json) -UseBasicParsing -TimeoutSec 20
  Write-Output "  signin -> $($r.StatusCode)"
} catch { Write-Output "  signin FAILED -> $($_.Exception.Message)" }

Line 'DOCTOR reads'
foreach ($p in @('/api/share','/api/audit')) {
  try {
    $r = Invoke-WebRequest -Uri "$base$p" -WebSession $sd -UseBasicParsing -TimeoutSec 25
    Write-Output "  $p -> $($r.StatusCode) len=$($r.Content.Length)"
  } catch { Write-Output "  $p -> ERR $($_.Exception.Message)" }
}

Line 'IDOR: doctor reading patient timeline without patientId'
try {
  $r = Invoke-WebRequest -Uri "$base/api/timeline" -WebSession $sd -UseBasicParsing -TimeoutSec 20
  Write-Output "  no patientId -> $($r.StatusCode)"
} catch { Write-Output "  no patientId -> $([int]$_.Exception.Response.StatusCode) (expected 400/403)" }

Line 'IDOR: doctor reading a random patientId'
try {
  $r = Invoke-WebRequest -Uri "$base/api/timeline?patientId=nonexistent_patient_xyz" -WebSession $sd -UseBasicParsing -TimeoutSec 20
  Write-Output "  bogus patientId -> $($r.StatusCode)"
} catch { Write-Output "  bogus patientId -> $([int]$_.Exception.Response.StatusCode) (expected 403)" }

Line 'EMERGENCY break-glass'
try {
  $e = (Invoke-WebRequest -Uri "$base/api/emergency" -Method POST -WebSession $sd -ContentType 'application/json' -Body (@{patientId='x';reason='unconscious patient in ED, need documented medications';otp='123456';confirm=$true} | ConvertTo-Json) -UseBasicParsing -TimeoutSec 25).Content | ConvertFrom-Json
  Write-Output "  emergency -> $($e | ConvertTo-Json -Compress -Depth 2)"
} catch { Write-Output "  emergency -> $([int]$_.Exception.Response.StatusCode) $($_.Exception.Message)" }

Line 'DOCUMENT stream authorization'
try {
  $d = (Invoke-WebRequest -Uri "$base/api/documents" -WebSession $sp -UseBasicParsing -TimeoutSec 25).Content | ConvertFrom-Json
  $docId = $d.documents[0].id
  Write-Output "  first doc id=$docId type=$($d.documents[0].docType) status=$($d.documents[0].status)"
  Write-Output "  summary: $($d.summary)"
  try {
    $r = Invoke-WebRequest -Uri "$base/api/documents/$docId/stream" -WebSession $sp -UseBasicParsing -TimeoutSec 25
    Write-Output "  stream(patient) -> $($r.StatusCode) contentType=$($r.Headers['Content-Type'])"
  } catch { Write-Output "  stream(patient) -> $([int]$_.Exception.Response.StatusCode)" }
  try {
    $r = Invoke-WebRequest -Uri "$base/api/documents/$docId/stream" -UseBasicParsing -TimeoutSec 20
    Write-Output "  stream(anon) -> $($r.StatusCode)"
  } catch { Write-Output "  stream(anon) -> $([int]$_.Exception.Response.StatusCode) (expected 401/403)" }
} catch { Write-Output "  ERR $($_.Exception.Message)" }

Line 'DONE'