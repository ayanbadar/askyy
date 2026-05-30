#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "Installing Python dev tools..."
python -m pip install -r requirements-dev.txt

echo "Installing frontend dependencies..."
(cd frontend && npm install)

echo "Installing pre-commit git hooks..."
pre-commit install --install-hooks

echo ""
echo "Dev setup complete. Git commits will now run pre-commit checks."
