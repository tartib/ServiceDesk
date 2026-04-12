/**
 * eslint-plugin-servicedesk-ds
 *
 * Custom ESLint rules for ServiceDesk Design System governance.
 * Rules:
 *   - no-raw-colors: Forbids raw Tailwind color scales (e.g. bg-purple-600)
 *   - no-arbitrary-z: Forbids z-[N] arbitrary z-index values
 *   - no-decorative-tones: Forbids deprecated decorative token classes (bg-purple, text-emerald, etc.)
 *   - no-brand-opacity-hacks: Forbids brand-opacity patterns like bg-brand/10, border-brand/30, text-brand/70
 */

"use strict";

// Pattern matches raw Tailwind color-scale classes like bg-purple-600, text-red-100, etc.
const RAW_COLOR_PATTERN =
  /\b(?:bg|text|border|ring|outline|shadow|from|via|to|divide|placeholder|decoration)-(purple|violet|orange|teal|indigo|pink|amber|emerald|cyan|blue|green|red|yellow|gray|zinc|slate|neutral|stone|rose|fuchsia|lime|sky|warm|cool)-\d{1,3}\b/g;

// Pattern matches brand-opacity hacks like bg-brand/10, hover:bg-brand/90, border-brand/30, text-brand/70
const BRAND_OPACITY_PATTERN =
  /\b(?:hover:|focus:|dark:)*(?:bg|text|border|ring|from|via|to)-brand\/\d+\b/g;

// Pattern matches arbitrary z-index like z-[50], z-[999]
const ARBITRARY_Z_PATTERN = /\bz-\[\d+\]/g;

// Pattern matches deprecated decorative tone token classes like bg-purple, text-emerald-light, etc.
const DECORATIVE_TONE_PATTERN =
  /\b(?:bg|text|border|ring|from|via|to|divide)-(purple|indigo|cyan|orange|amber|emerald|teal|pink|slate)(?:-light|-foreground)?\b/g;

/**
 * Scans a string literal / template literal for raw color violations.
 */
function checkForRawColors(node, value, context) {
  const matches = value.match(RAW_COLOR_PATTERN);
  if (matches) {
    context.report({
      node,
      message: `Avoid raw Tailwind color scale "{{ match }}". Use a semantic design token instead (e.g. bg-purple, bg-brand, text-destructive). See docs/design-system/MIGRATION.md.`,
      data: { match: matches[0] },
    });
  }
}

function checkForDecorativeTones(node, value, context) {
  const matches = value.match(DECORATIVE_TONE_PATTERN);
  if (matches) {
    const tone = matches[0];
    const mapping = {
      purple: 'info', indigo: 'info', cyan: 'info',
      orange: 'warning', amber: 'warning',
      emerald: 'success', teal: 'success',
      pink: 'destructive', slate: 'muted',
    };
    const decorName = tone.match(/-(purple|indigo|cyan|orange|amber|emerald|teal|pink|slate)/)?.[1] || '';
    const semantic = mapping[decorName] || 'semantic';
    context.report({
      node,
      message: `Deprecated decorative tone "{{ match }}". Use the semantic equivalent (${semantic}). See docs/design-system/MIGRATION.md.`,
      data: { match: tone },
    });
  }
}

function checkForArbitraryZ(node, value, context) {
  const matches = value.match(ARBITRARY_Z_PATTERN);
  if (matches) {
    context.report({
      node,
      message: `Avoid arbitrary z-index "{{ match }}". Use a semantic z-index token (z-dropdown, z-modal, z-toast, etc.). See docs/design-system/FOUNDATIONS.md.`,
      data: { match: matches[0] },
    });
  }
}

function checkForBrandOpacity(node, value, context) {
  const matches = value.match(BRAND_OPACITY_PATTERN);
  if (matches) {
    context.report({
      node,
      message: `Avoid brand opacity hack "{{ match }}". Use a named brand token instead (bg-brand-surface, bg-brand-soft, bg-brand-strong, border-brand-border, text-brand). See docs/design-system/MIGRATION.md.`,
      data: { match: matches[0] },
    });
  }
}

module.exports = {
  rules: {
    "no-raw-colors": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Disallow raw Tailwind color scale classes",
          category: "Design System",
          recommended: true,
        },
        schema: [],
        messages: {},
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === "string") {
              checkForRawColors(node, node.value, context);
            }
          },
          TemplateLiteral(node) {
            node.quasis.forEach((quasi) => {
              if (quasi.value && quasi.value.raw) {
                checkForRawColors(node, quasi.value.raw, context);
              }
            });
          },
        };
      },
    },

    "no-arbitrary-z": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Disallow arbitrary z-index values (z-[N])",
          category: "Design System",
          recommended: true,
        },
        schema: [],
        messages: {},
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === "string") {
              checkForArbitraryZ(node, node.value, context);
            }
          },
          TemplateLiteral(node) {
            node.quasis.forEach((quasi) => {
              if (quasi.value && quasi.value.raw) {
                checkForArbitraryZ(node, quasi.value.raw, context);
              }
            });
          },
        };
      },
    },

    "no-decorative-tones": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow deprecated decorative tone token classes (bg-purple, text-emerald, etc.)",
          category: "Design System",
          recommended: true,
        },
        schema: [],
        messages: {},
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === "string") {
              checkForDecorativeTones(node, node.value, context);
            }
          },
          TemplateLiteral(node) {
            node.quasis.forEach((quasi) => {
              if (quasi.value && quasi.value.raw) {
                checkForDecorativeTones(node, quasi.value.raw, context);
              }
            });
          },
        };
      },
    },

    "no-brand-opacity-hacks": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow brand-opacity patterns (bg-brand/10, border-brand/30, etc.)",
          category: "Design System",
          recommended: true,
        },
        schema: [],
        messages: {},
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === "string") {
              checkForBrandOpacity(node, node.value, context);
            }
          },
          TemplateLiteral(node) {
            node.quasis.forEach((quasi) => {
              if (quasi.value && quasi.value.raw) {
                checkForBrandOpacity(node, quasi.value.raw, context);
              }
            });
          },
        };
      },
    },
  },
};
