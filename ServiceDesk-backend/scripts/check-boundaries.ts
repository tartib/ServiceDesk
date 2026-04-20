#!/usr/bin/env ts-node
/// <reference types="node" />
/**
 * Architecture Boundary Check Script
 *
 * Validates that:
 * 1. No new files are added to frozen legacy directories
 * 2. No cross-module internal imports exist
 * 3. shared/ does not import from modules/
 *
 * Usage:
 *   npx ts-node scripts/check-boundaries.ts          # check all files
 *   npx ts-node scripts/check-boundaries.ts --diff    # check only staged changes
 *
 * Exit code 0 = pass, 1 = violations found
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..', 'src');

const FROZEN_DIRS = [
  'controllers',
  'routes',
  'services',
  'presentation',
];

const ALLOWED_FROZEN_FILES = new Set([
  'LEGACY-FROZEN.md',
  '.gitkeep',
  '__tests__',
]);

// Files explicitly whitelisted via ADR or maintenance approval
const WHITELISTED_FROZEN_PATHS = new Set([
  'src/presentation/routes/v2/index.ts', // Deprecation marker added — maintenance-only
  'src/routes/index.ts', // Feature flag gating changes — no new business logic
]);

interface Violation {
  file: string;
  rule: string;
  detail: string;
  severity?: 'error' | 'warn';
}

const violations: Violation[] = [];
const isDiff = process.argv.includes('--diff');

// Freeze date — files modified after this date in frozen dirs are violations
const FREEZE_DATE = new Date('2026-03-20T00:00:00Z');

// ── Rule 1: No new files in frozen directories ─────────────────

function checkFrozenDirs(): void {
  if (isDiff) {
    // Diff mode: check only staged new files
    let stagedFiles: string[];
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=A', {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '..'),
      });
      stagedFiles = output.trim().split('\n').filter(Boolean);
    } catch {
      console.warn('Warning: git not available, skipping frozen-dir check');
      return;
    }

    for (const file of stagedFiles) {
      checkFrozenFile(file);
    }
  } else {
    // Full-scan mode: check all .ts files in frozen dirs for post-freeze additions
    for (const dir of FROZEN_DIRS) {
      const frozenPath = path.join(SRC, dir);
      if (!fs.existsSync(frozenPath)) continue;
      walkTs(frozenPath, (filePath) => {
        const stat = fs.statSync(filePath);
        if (stat.mtime > FREEZE_DATE) {
          const rel = path.relative(path.resolve(__dirname, '..'), filePath);
          const basename = path.basename(filePath);
          const parentDir = path.basename(path.dirname(filePath));
          if (ALLOWED_FROZEN_FILES.has(basename) || ALLOWED_FROZEN_FILES.has(parentDir)) return;
          if (WHITELISTED_FROZEN_PATHS.has(rel)) return;
          violations.push({
            file: rel,
            rule: 'frozen-directory',
            detail: `File modified after freeze date (${FREEZE_DATE.toISOString().slice(0, 10)}) in frozen directory src/${dir}/. New code must go in src/modules/.`,
          });
        }
      });
    }
  }
}

function checkFrozenFile(file: string): void {
  for (const dir of FROZEN_DIRS) {
    const frozenPrefix = `src/${dir}/`;
    if (file.startsWith(frozenPrefix)) {
      const basename = path.basename(file);
      const parentDir = path.basename(path.dirname(file));
      if (ALLOWED_FROZEN_FILES.has(basename) || ALLOWED_FROZEN_FILES.has(parentDir)) return;
      if (WHITELISTED_FROZEN_PATHS.has(file)) return;
      violations.push({
        file,
        rule: 'frozen-directory',
        detail: `New file in frozen directory src/${dir}/. New code must go in src/modules/.`,
      });
    }
  }
}

// ── Rule 2: No cross-module internal imports ────────────────────

function checkCrossModuleImports(): void {
  const modulesDir = path.join(SRC, 'modules');
  if (!fs.existsSync(modulesDir)) return;

  const moduleNames = fs.readdirSync(modulesDir).filter((name) => {
    const full = path.join(modulesDir, name);
    return fs.statSync(full).isDirectory();
  });

  for (const moduleName of moduleNames) {
    const moduleDir = path.join(modulesDir, moduleName);
    walkTs(moduleDir, (filePath, content) => {
      // Find import statements
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match: RegExpExecArray | null;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // Check if importing from another module's internals
        for (const otherModule of moduleNames) {
          if (otherModule === moduleName) continue;

          // Patterns that indicate cross-module internal imports
          const internalPatterns = [
            `modules/${otherModule}/controllers/`,
            `modules/${otherModule}/services/`,
            `modules/${otherModule}/infrastructure/`,
            `modules/${otherModule}/domain/`,
            `modules/${otherModule}/engine/`,
            `modules/${otherModule}/models/`,
          ];

          for (const pattern of internalPatterns) {
            if (importPath.includes(pattern)) {
              const rel = path.relative(SRC, filePath);
              violations.push({
                file: `src/${rel}`,
                rule: 'cross-module-import',
                detail: `Module "${moduleName}" imports from "${otherModule}" internals: ${importPath}`,
              });
            }
          }
        }
      }
    });
  }
}

// ── Rule 3: shared/ must not import from modules/ ───────────────

function checkSharedIndependence(): void {
  const sharedDir = path.join(SRC, 'shared');
  if (!fs.existsSync(sharedDir)) return;

  walkTs(sharedDir, (filePath, content) => {
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.includes('modules/')) {
        const rel = path.relative(SRC, filePath);
        violations.push({
          file: `src/${rel}`,
          rule: 'shared-imports-module',
          detail: `shared/ must not depend on modules/: ${importPath}`,
        });
      }
    }
  });
}

// ── Rule 4: No v1 API references in module code ─────────────────

function checkNoV1InModules(): void {
  const modulesDir = path.join(SRC, 'modules');
  if (!fs.existsSync(modulesDir)) return;

  walkTs(modulesDir, (filePath, content) => {
    const rel = path.relative(path.resolve(__dirname, '..'), filePath);
    // Skip test files
    if (rel.includes('__tests__') || rel.includes('.test.') || rel.includes('.spec.')) return;

    // Check for /api/v1 string literals (route definitions or fetch calls)
    const v1Regex = /['"`]\/api\/v1\//g;
    let match: RegExpExecArray | null;
    while ((match = v1Regex.exec(content)) !== null) {
      violations.push({
        file: rel,
        rule: 'no-v1-in-modules',
        detail: `Module code references /api/v1/ — all new routes must use /api/v2/. (col ${match.index})`,
      });
    }
  });
}

// ── Rule 5: No manual validationResult in module controllers ─────

function checkNoManualValidation(): void {
  const modulesDir = path.join(SRC, 'modules');
  if (!fs.existsSync(modulesDir)) return;

  walkTs(modulesDir, (filePath, content) => {
    const rel = path.relative(path.resolve(__dirname, '..'), filePath);
    // Only check controller files
    if (!rel.includes('/controllers/')) return;
    if (rel.includes('__tests__')) return;

    if (content.includes('validationResult(req)')) {
      violations.push({
        file: rel,
        rule: 'no-manual-validation',
        severity: 'warn',
        detail: `Controller uses validationResult(req) directly. Use handleValidation middleware in routes instead. (migration: incremental)`,
      });
    }
  });
}

// ── Helpers ─────────────────────────────────────────────────────

function walkTs(dir: string, callback: (filePath: string, content: string) => void): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walkTs(full, callback);
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.d.ts')
    ) {
      const content = fs.readFileSync(full, 'utf-8');
      callback(full, content);
    }
  }
}

// ── Rule 6: No service-catalog importing smart-forms/builder internals ──────

function checkPlatformBoundaries(): void {
  // This rule applies to the frontend source, not the backend.
  // We check a sibling path relative to the backend scripts/ dir.
  const frontendSrc = path.resolve(__dirname, '..', '..', 'ServiceDesk-app');
  if (!fs.existsSync(frontendSrc)) return;

  const serviceCatalogDir = path.join(frontendSrc, 'components', 'service-catalog');
  if (!fs.existsSync(serviceCatalogDir)) return;

  const FORBIDDEN_PATTERN = 'smart-forms/builder/';
  const ALLOWED_SHELL = 'forms-platform/';

  walkTs(serviceCatalogDir, (filePath, content) => {
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.includes(FORBIDDEN_PATTERN) && !importPath.includes(ALLOWED_SHELL)) {
        const rel = path.relative(frontendSrc, filePath);
        violations.push({
          file: rel,
          rule: 'platform-builder-boundary',
          detail: `service-catalog must not import smart-forms/builder internals directly. Use components/forms-platform/ shell instead. Found: ${importPath}`,
        });
      }
    }
  });
}

// ── Rule 7: No app/(dashboard) page importing smart-forms/builder internals ──

function checkAppPageBuilderBoundary(): void {
  const frontendSrc = path.resolve(__dirname, '..', '..', 'ServiceDesk-app');
  if (!fs.existsSync(frontendSrc)) return;

  const dashboardDir = path.join(frontendSrc, 'app', '(dashboard)');
  if (!fs.existsSync(dashboardDir)) return;

  const FORBIDDEN_PATTERN = 'smart-forms/builder';
  const SHELL_EXEMPTION = path.join(frontendSrc, 'components', 'forms-platform');

  walkTs(dashboardDir, (filePath, content) => {
    if (filePath.startsWith(SHELL_EXEMPTION)) return;
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.includes(FORBIDDEN_PATTERN)) {
        const rel = path.relative(frontendSrc, filePath);
        violations.push({
          file: rel,
          rule: 'app-page-builder-boundary',
          detail: `app/(dashboard) pages must not import smart-forms/builder internals directly. Use components/forms-platform/FormDefinitionBuilder instead. Found: ${importPath}`,
        });
      }
    }
  });
}

// ── Main ────────────────────────────────────────────────────────

checkFrozenDirs();
checkCrossModuleImports();
checkSharedIndependence();
checkNoV1InModules();
checkNoManualValidation();
checkPlatformBoundaries();
checkAppPageBuilderBoundary();

const errors = violations.filter((v) => v.severity !== 'warn');
const warnings = violations.filter((v) => v.severity === 'warn');

if (warnings.length > 0) {
  console.warn(`⚠️  ${warnings.length} warning(s) (non-blocking):\n`);
  for (const v of warnings) {
    console.warn(`  [${v.rule}] ${v.file}`);
    console.warn(`    → ${v.detail}\n`);
  }
}

if (errors.length === 0) {
  console.log('✅ Architecture boundary check passed');
  process.exit(0);
} else {
  console.error(`❌ ${errors.length} boundary error(s) found:\n`);
  for (const v of errors) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    → ${v.detail}\n`);
  }
  process.exit(1);
}
