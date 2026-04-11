#!/usr/bin/env bash
# Pre-merge contract check — verifies API route alignment between code, tests, and docs.
# Run before merging to ensure no drift.
#
# Usage:
#   ./scripts/check-contracts.sh
#   npm run check:contracts  (if added to package.json)

set -euo pipefail

echo "Running contract tests..."
npx vitest run tests/contracts/ --reporter=verbose

echo ""
echo "All contract tests passed."
