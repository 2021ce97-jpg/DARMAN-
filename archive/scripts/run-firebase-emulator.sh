#!/usr/bin/env bash
set -euo pipefail

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI not found. Install: npm install -g firebase-tools"
  exit 1
fi

firebase emulators:start --project mediconnect-4b155
