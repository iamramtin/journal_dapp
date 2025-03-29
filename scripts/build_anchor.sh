#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Catch errors in pipelines

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

cd "anchor"

log "Starting Anchor build process..."
anchor build || { log "Anchor build failed"; exit 1; }

log "Build process completed successfully."

cd -
