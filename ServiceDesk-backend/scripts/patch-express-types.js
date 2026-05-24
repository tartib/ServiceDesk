/**
 * Patch @types/express-serve-static-core to narrow ParamsDictionary.
 *
 * Express 5 widens route params to `string | string[]`, but named route
 * params (e.g. /:id) are always single strings in practice.  This patch
 * narrows the index signature so existing controllers compile without
 * individual casts.
 *
 * Runs automatically via the "postinstall" npm script.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@types',
  'express-serve-static-core',
  'index.d.ts',
);

if (!fs.existsSync(target)) {
  console.log('[patch-express-types] Target file not found — skipping.');
  process.exit(0);
}

let content = fs.readFileSync(target, 'utf8');
const before = content;

content = content.replace(
  /\[key: string\]: string \| string\[\];/g,
  '[key: string]: string;',
);

if (content !== before) {
  fs.writeFileSync(target, content, 'utf8');
  console.log('[patch-express-types] Narrowed ParamsDictionary to string.');
} else {
  console.log('[patch-express-types] Already patched — nothing to do.');
}
