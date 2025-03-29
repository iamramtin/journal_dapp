#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Catch errors in pipelines

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

cd "anchor"

log "Deploying Anchor program to localnet..."
anchor deploy --provider.cluster localnet || { log "Anchor deploy failed"; exit 1; }

SO_FILE="target/deploy/journal.so"
DEST_DIR="tests/fixtures"

if [ -f "$SO_FILE" ]; then
  log "Copying .so file to $DEST_DIR..."
  cp "$SO_FILE" "$DEST_DIR" || { log "Failed to copy .so file"; exit 1; }
  log "File copied successfully."
else
  log "Error: .so file not found at $SO_FILE"
  exit 1
fi

log "Deploy process completed successfully."

cd -
