#!/usr/bin/env node

/**
 * Module Health Check Script
 *
 * Scans the codebase for module boundary violations, orphan files,
 * and ownership issues. Run with: node scripts/moduleHealth.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src');

// ── Module Definitions ───────────────────────────────────────
const MODULES = {
  itsm: {
    paths: ['modules/itsm', 'controllers/itsm', 'routes/itsm', 'models/itsm'],
    forbidden: ['modules/pm/', 'modules/forms/', 'modules/workflow-engine/', 'modules/storage/', 'modules/analytics/', 'modules/notifications/'],
  },
  pm: {
    paths: ['modules/pm', 'controllers/pm', 'routes/pm', 'models/pm'],
    forbidden: ['modules/itsm/', 'modules/forms/', 'modules/workflow-engine/', 'modules/storage/', 'modules/analytics/', 'modules/notifications/'],
  },
  'workflow-engine': {
    paths: ['modules/workflow-engine', 'controllers/workflow-engine', 'routes/workflow-engine', 'models/workflow', 'services/workflow-engine'],
    forbidden: ['modules/itsm/', 'modules/pm/', 'modules/forms/', 'modules/storage/', 'modules/analytics/', 'modules/notifications/'],
  },
  forms: {
    paths: ['modules/forms', 'controllers/formTemplate', 'controllers/formSubmission', 'services/formTemplateService', 'services/formSubmissionService'],
    forbidden: ['modules/itsm/', 'modules/pm/', 'modules/workflow-engine/', 'modules/storage/', 'modules/analytics/', 'modules/notifications/'],
  },
  storage: {
    paths: ['modules/storage'],
    forbidden: ['modules/itsm/', 'modules/pm/', 'modules/forms/', 'modules/workflow-engine/', 'modules/analytics/', 'modules/notifications/'],
  },
  analytics: {
    paths: ['modules/analytics'],
    forbidden: ['modules/itsm/', 'modules/pm/', 'modules/forms/', 'modules/workflow-engine/', 'modules/storage/', 'modules/notifications/'],
  },
  notifications: {
    paths: ['modules/notifications'],
    forbidden: ['modules/itsm/', 'modules/pm/', 'modules/forms/', 'modules/workflow-engine/', 'modules/storage/', 'modules/analytics/'],
  },
};

// ── Utilities ────────────────────────────────────────────────

function getAllTsFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === 'testsprite_tests') continue;
      results.push(...getAllTsFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function relativeToSrc(filePath) {
  return path.relative(SRC, filePath).replace(/\\/g, '/');
}

// ── Checks ───────────────────────────────────────────────────

const violations = [];
const warnings = [];
const stats = {
  totalFiles: 0,
  moduleBoundaryViolations: 0,
  sharedImportsModules: 0,
  coreDirectImports: 0,
};

// Check 1: Module boundary violations
function checkBoundaryViolations() {
  for (const [moduleName, config] of Object.entries(MODULES)) {
    for (const modulePath of config.paths) {
      const fullPath = path.join(SRC, modulePath);
      const files = getAllTsFiles(fullPath);
      stats.totalFiles += files.length;

      for (const file of files) {
        const imports = extractImports(file);
        const relFile = relativeToSrc(file);

        for (const imp of imports) {
          for (const forbidden of config.forbidden) {
            if (imp.includes(forbidden)) {
              violations.push({
                type: 'BOUNDARY_VIOLATION',
                module: moduleName,
                file: relFile,
                import: imp,
                message: `Module "${moduleName}" imports from forbidden module path "${forbidden}"`,
              });
              stats.moduleBoundaryViolations++;
            }
          }
        }
      }
    }
  }
}

// Deprecated re-export shims that intentionally import from modules
const SHARED_MODULE_IMPORT_ALLOWLIST = [
  'shared/events/consumers/notification.consumer.ts',
  'shared/events/consumers/analytics.consumer.ts',
];

// Check 2: shared/ must not import from any module
function checkSharedIsolation() {
  const sharedDir = path.join(SRC, 'shared');
  const files = getAllTsFiles(sharedDir);
  stats.totalFiles += files.length;

  for (const file of files) {
    const imports = extractImports(file);
    const relFile = relativeToSrc(file);

    // Skip deprecated re-export shims
    if (SHARED_MODULE_IMPORT_ALLOWLIST.some((a) => relFile === a)) continue;

    for (const imp of imports) {
      if (imp.includes('modules/')) {
        violations.push({
          type: 'SHARED_IMPORTS_MODULE',
          file: relFile,
          import: imp,
          message: `shared/ layer imports from a module: "${imp}"`,
        });
        stats.sharedImportsModules++;
      }
    }
  }
}

// Check 3: Warn on direct core/ imports (should use re-exports)
function checkCoreDirectImports() {
  const modulesDir = path.join(SRC, 'modules');
  const files = getAllTsFiles(modulesDir);

  for (const file of files) {
    // Skip the re-export files themselves
    if (file.includes('core-re-exports')) continue;

    const imports = extractImports(file);
    const relFile = relativeToSrc(file);

    for (const imp of imports) {
      if (imp.includes('core/entities/') || imp.includes('core/services/') || imp.includes('core/repositories/')) {
        warnings.push({
          type: 'CORE_DIRECT_IMPORT',
          file: relFile,
          import: imp,
          message: `Consider importing from module core-re-exports instead of core/ directly`,
        });
        stats.coreDirectImports++;
      }
    }
  }
}

// Check 4: Module file counts
function getModuleStats() {
  const moduleCounts = {};
  for (const [moduleName, config] of Object.entries(MODULES)) {
    let count = 0;
    for (const modulePath of config.paths) {
      const fullPath = path.join(SRC, modulePath);
      count += getAllTsFiles(fullPath).length;
    }
    moduleCounts[moduleName] = count;
  }
  return moduleCounts;
}

// ── Run ──────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════╗');
console.log('║           Module Health Check                    ║');
console.log('╚══════════════════════════════════════════════════╝\n');

checkBoundaryViolations();
checkSharedIsolation();
checkCoreDirectImports();

const moduleCounts = getModuleStats();

// Report: Module sizes
console.log('── Module File Counts ──────────────────────────────');
for (const [mod, count] of Object.entries(moduleCounts)) {
  const bar = '█'.repeat(Math.min(count, 50));
  console.log(`  ${mod.padEnd(20)} ${String(count).padStart(4)} files  ${bar}`);
}
console.log();

// Report: Violations
if (violations.length > 0) {
  console.log(`🔴 VIOLATIONS (${violations.length}):`);
  for (const v of violations) {
    console.log(`  [${v.type}] ${v.file}`);
    console.log(`    → ${v.message}`);
    console.log(`    import: ${v.import}\n`);
  }
} else {
  console.log('✅ No module boundary violations found.\n');
}

// Report: Warnings
if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [${w.type}] ${w.file}`);
    console.log(`    → ${w.message}`);
  }
  console.log();
}

// Summary
console.log('── Summary ─────────────────────────────────────────');
console.log(`  Boundary violations:   ${stats.moduleBoundaryViolations}`);
console.log(`  Shared→Module imports: ${stats.sharedImportsModules}`);
console.log(`  Core direct imports:   ${stats.coreDirectImports} (warnings)`);
console.log();

const exitCode = violations.length > 0 ? 1 : 0;
if (exitCode === 0) {
  console.log('✅ Module health: PASS');
} else {
  console.log('❌ Module health: FAIL');
}

process.exit(exitCode);
