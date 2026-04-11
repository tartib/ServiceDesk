#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# ServiceDesk — CI Quality Gate
#
# Runs all checks that must pass before merge. Exit code 0 = pass.
# Usage:  ./scripts/quality-gate.sh
# ──────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

step() {
  echo ""
  echo -e "${YELLOW}▸ $1${NC}"
}

pass() {
  echo -e "  ${GREEN}✓ $1${NC}"
  ((PASS++))
}

fail() {
  echo -e "  ${RED}✗ $1${NC}"
  ((FAIL++))
}

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── 1. Backend TypeScript compilation ───────────────────────
step "Backend — tsc --noEmit"
if (cd "$ROOT_DIR/ServiceDesk-backend" && npx tsc --noEmit 2>&1); then
  pass "Zero TS errors"
else
  fail "TypeScript compilation errors"
fi

# ── 2. Frontend TypeScript compilation ──────────────────────
step "Frontend — tsc --noEmit"
if (cd "$ROOT_DIR/ServiceDesk-app" && npx tsc --noEmit 2>&1); then
  pass "Zero TS errors"
else
  fail "TypeScript compilation errors"
fi

# ── 3. Frontend lint ────────────────────────────────────────
step "Frontend — ESLint"
if (cd "$ROOT_DIR/ServiceDesk-app" && npx next lint --quiet 2>&1); then
  pass "No lint errors"
else
  fail "Lint errors found"
fi

# ── 4. Contract tests ──────────────────────────────────────
step "Frontend — Contract tests (vitest)"
if (cd "$ROOT_DIR/ServiceDesk-app" && npx vitest run tests/contracts/ --reporter=dot 2>&1); then
  pass "All contract tests pass"
else
  fail "Contract test failures"
fi

# ── 5. Frontend build ──────────────────────────────────────
step "Frontend — Production build"
if (cd "$ROOT_DIR/ServiceDesk-app" && npm run build 2>&1); then
  pass "Build succeeded"
else
  fail "Build failed"
fi

# ── Summary ─────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}Quality gate FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}Quality gate PASSED${NC}"
  exit 0
fi
