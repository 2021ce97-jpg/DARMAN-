#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-darman-api}"
ENV_FILE="${2:-.env.production}"
SECRET_FILE="${3:-./serviceAccountKey.json}"
DEPLOY="${4:-false}"

if ! command -v render >/dev/null 2>&1; then
  echo "Render CLI not found. Install from https://github.com/render-oss/cli"
  exit 1
fi

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "RENDER_API_KEY not set. Run 'render login' or export RENDER_API_KEY"
  exit 1
fi

SERVICE_JSON=$(render services --output json)
SERVICE_ID=$(echo "$SERVICE_JSON" | jq -r --arg NAME "$SERVICE_NAME" '.[] | select(.name==$NAME) | .id' | head -n1)

if [ -z "$SERVICE_ID" ]; then
  echo "Service '$SERVICE_NAME' not found"
  exit 1
fi

echo "Found service id: $SERVICE_ID"

if [ -f "$ENV_FILE" ]; then
  while IFS= read -r line; do
    line="${line%%#*}"
    line="$(echo -e "${line}" | sed -e 's/^[[:space:]]*//')"
    if [ -n "$line" ]; then
      IFS='=' read -r key val <<< "$line"
      val=$(echo "$val" | sed -e 's/^"//' -e 's/"$//')
      echo "Setting env: $key"
      render services update "$SERVICE_ID" --env-var "$key=$val" --confirm >/dev/null
    fi
  done < "$ENV_FILE"
  echo "Env vars updated from $ENV_FILE"
else
  echo "Env file '$ENV_FILE' not found; skipping env upload."
fi

if [ -f "$SECRET_FILE" ]; then
  echo "Uploading secret file as FIREBASE_SERVICE_ACCOUNT"
  render services update "$SERVICE_ID" --secret-file "FIREBASE_SERVICE_ACCOUNT:$SECRET_FILE" --confirm >/dev/null
  echo "Secret file uploaded."
else
  echo "Secret file '$SECRET_FILE' not found; skipping secret file upload."
fi

if [ "$DEPLOY" = "true" ]; then
  echo "Triggering deploy..."
  render deploys create "$SERVICE_ID" --wait
fi

echo "Done."
