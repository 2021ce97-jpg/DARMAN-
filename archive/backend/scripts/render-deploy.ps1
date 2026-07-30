param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "darman-api",
    [Parameter(Mandatory=$false)]
    [string]$EnvFile = ".env.production",
    [Parameter(Mandatory=$false)]
    [string]$SecretFile = "./serviceAccountKey.json",
    [switch]$Deploy
)

if (-not (Get-Command render -ErrorAction SilentlyContinue)) {
    Write-Host "Render CLI not found. Install from https://github.com/render-oss/cli" -ForegroundColor Yellow
    exit 1
}

if (-not $Env:RENDER_API_KEY) {
    Write-Host "RENDER_API_KEY is not set. Run 'render login' or set RENDER_API_KEY env var." -ForegroundColor Yellow
    exit 1
}

Write-Host "Resolving service id for '$ServiceName'..."
$servicesJson = render services --output json
try {
    $services = $servicesJson | ConvertFrom-Json
} catch {
    Write-Host "Failed to parse services json." -ForegroundColor Red
    Write-Host $servicesJson
    exit 1
}

$service = $services | Where-Object { $_.name -eq $ServiceName } | Select-Object -First 1
if (-not $service) {
    Write-Host "Service '$ServiceName' not found. Use 'render services --output json' to list services." -ForegroundColor Red
    exit 1
}

$serviceId = $service.id
Write-Host "Found service id: $serviceId"

# Upload environment variables from file
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=",2
            if ($parts.Count -ge 2) {
                $k = $parts[0].Trim()
                $v = $parts[1].Trim().Trim('"')
                Write-Host "Setting env: $k"
                & render services update $serviceId --env-var "$k=$v" --confirm | Out-Null
            }
        }
    }
    Write-Host "Env vars updated from $EnvFile"
} else {
    Write-Host "Env file '$EnvFile' not found; skipping env upload." -ForegroundColor Yellow
}

# Upload secret file (service account)
if (Test-Path $SecretFile) {
    Write-Host "Uploading secret file as FIREBASE_SERVICE_ACCOUNT"
    & render services update $serviceId --secret-file "FIREBASE_SERVICE_ACCOUNT:$SecretFile" --confirm | Out-Null
    Write-Host "Secret file uploaded."
} else {
    Write-Host "Secret file '$SecretFile' not found; skipping secret file upload." -ForegroundColor Yellow
}

if ($Deploy) {
    Write-Host "Triggering deploy..."
    & render deploys create $serviceId --wait
}

Write-Host "Done."
