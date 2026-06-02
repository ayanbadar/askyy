#!/usr/bin/env bash
# Run on the Oracle VM to pull latest images and restart the stack.
# Usage: ./scripts/vm-update.sh [image_tag]
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

tag="${1:-latest}"
printf 'IMAGE_TAG=%s\n' "$tag" > .env.deploy

docker compose -f docker-compose.prod.yml --env-file .env --env-file .env.deploy pull
docker compose -f docker-compose.prod.yml --env-file .env --env-file .env.deploy up -d --remove-orphans
docker compose -f docker-compose.prod.yml ps
