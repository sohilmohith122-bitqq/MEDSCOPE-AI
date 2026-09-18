$ErrorActionPreference = "Continue"
$base = 'http://localhost:3001'
function Show($label, $value) { Write-Host ("{0}: {1}" -f $label, $value) }

# 1. Unauthenticated guards
foreach ($p in @('/','/signin','/api/timeline','/api/documents','/api/events','/api/share','/api/audit')) {
  try {
    $r = Invoke-WebRequest -Uri ($base + $p) -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    Show "GET $p" ("{0} len={1}" -f $r.StatusCode, $r.Content.Length)
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Show "GET $p" ("{0} ({1})" -f $code, $_.Exception.Message.Split([char]10)[0])
  }
}

# 2. PATIENT signin
$ps = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/signin" -Method POST -WebSession $ps -ContentType 'application/json' `
    -Body (@{ email = 'patient@demo.medcare'; password = 'demo1234' } | ConvertTo-Json) -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
  Show 'PATIENT signin' ("{0} {1}" -f $r.StatusCode, $r.Content)
} catch { Show 'PATIENT signin' ("FAIL {0}" -f $_.Exception.Message) }

# 3. PATIENT authenticated reads
$timeline = $null
try {
  $r = Invoke-WebRequest -Uri "$base/api/timeline" -WebSession $ps -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
  $timeline = $r.Content | ConvertFrom-Json
  Show 'PATIENT GET /api/timeline' ("{0} events={1}" -f $r.StatusCode, $timeline.events.Count)
  if ($timeline.events.Count -gt 0) {
    $e = $timeline.events[0]
    Show '  first event' ("{0} | {1} | {2} | {3} | doc={4} p.{5}" -f $e.title, $e.eventDate, $e.datePrecision, $e.evidenceStatus, $e.sourceDocumentId, $e.sourcePage)
  }
} catch { Show 'PATIENT GET /api/timeline' ("FAIL {0}" -f $_.Exception.Message) }

foreach ($p in @('/api/documents','/api/events','/api/share','/api/audit','/api/snapshots')) {
  try {
    $r = Invoke-WebRequest -Uri ($base + $p) -WebSession $ps -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
    Show "PATIENT GET $p" ("{0} len={1}" -f $r.StatusCode, $r.Content.Length)
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Show "PATIENT GET $p" ("{0} {1}" -f $code, $_.Exception.Message.Split([char]10)[0])
  }
}

# 4. PATIENT conflicts/questions
try {
  $r = Invoke-WebRequest -Uri "$base/api/chat" -Method POST -WebSession $ps -ContentType 'application/json' `
    -Body (@{ question = 'Show conflicts' } | ConvertTo-Json) -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
  $c = $r.Content | ConvertFrom-Json
  Show 'PATIENT POST /api/chat (conflicts)' ("{0} answer={1}" -f $r.StatusCode, $c.answer)
} catch { Show 'PATIENT POST /api/chat' ("FAIL {0}" -f $_.Exception.Message) }

# 5. PATIENT creates a share
try {
  $r = Invoke-WebRequest -Uri "$base/api/share" -Method POST -WebSession $ps -ContentType 'application/json' `
    -Body (@{ scopes = @('TIMELINE','MEDICATIONS'); permission = 'VIEW_ONLY'; expiresIn = '24h'; documentIds = @() } | ConvertTo-Json) `
    -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
  $sh = $r.Content | ConvertFrom-Json
  Show 'PATIENT POST /api/share' ("{0} expires={1} url={2}" -f $r.StatusCode, $sh.expiresAt, $sh.shareUrl)
  Show '  share token len' ($sh.token.Length)
} catch { Show 'PATIENT POST /api/share' ("FAIL {0}" -f $_.Exception.Message) }

# 6. DOCTOR signin
$ds = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/signin" -Method POST -WebSession $ds -ContentType 'application/json' `
    -Body (@{ email = 'doctor@demo.medcare'; password = 'demo1234' } | ConvertTo-Json) -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
  Show 'DOCTOR signin' ("{0}" -f $r.StatusCode)
} catch { Show 'DOCTOR signin' ("FAIL {0}" -f $_.Exception.Message) }

foreach ($p in @('/api/timeline','/api/documents','/api/audit')) {
  try {
    $r = Invoke-WebRequest -Uri ($base + $p) -WebSession $ds -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
    Show "DOCTOR GET $p" ("{0} len={1}" -f $r.StatusCode, $r.Content.Length)
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Show "DOCTOR GET $p" ("{0} {1}" -f $code, $_.Exception.Message.Split([char]10)[0])
  }
}

# 7. IDOR: doctor tries arbitrary patientId -> must be 403
try {
  $r = Invoke-WebRequest -Uri "$base/api/timeline?patientId=not-my-patient" -WebSession $ds -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
  Show 'DOCTOR IDOR /api/timeline?patientId=not-my-patient' ("{0} len={1}" -f $r.StatusCode, $r.Content.Length)
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Show 'DOCTOR IDOR /api/timeline?patientId=not-my-patient' ("{0} (expected 403)" -f $code)
}

# 8. Emergency break-glass: bad reason must be rejected
try {
  $r = Invoke-WebRequest -Uri "$base/api/emergency" -Method POST -WebSession $ds -ContentType 'application/json' `
    -Body (@{ patientId = 'x'; reason = 'short'; otp = '1'; confirm = $false } | ConvertTo-Json) -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
  Show 'DOCTOR POST /api/emergency (invalid)' ("{0} (expected 400)" -f $r.StatusCode)
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Show 'DOCTOR POST /api/emergency (invalid)' ("{0} (expected 400)" -f $code)
}

Write-Host ""
Write-Host "DONE"

