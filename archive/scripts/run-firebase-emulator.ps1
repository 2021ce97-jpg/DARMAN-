# Start Firebase emulator suite (PowerShell helper)
Write-Host "Starting Firebase emulators..."
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
  Write-Host "Firebase CLI not found. Install: npm install -g firebase-tools" -ForegroundColor Yellow
  exit 1
}

pushd "$(Resolve-Path .)"
firebase emulators:start --project mediconnect-4b155
popd
