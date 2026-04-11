/**
 * Template Renderer — Mustache-style variable interpolation
 */

import NotificationTemplate from '../models/NotificationTemplate';
import logger from '../../../utils/logger';

export interface RenderContext {
  [key: string]: unknown;
}

export interface RenderedContent {
  subject?: string;
  body: string;
  bodyHtml?: string;
}

/**
 * Interpolate {{variable}} placeholders in a string.
 */
function interpolate(template: string, context: RenderContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const val = context[key];
    if (val !== undefined && val !== null) return String(val);
    return match; // leave unresolved placeholders as-is
  });
}

/**
 * Extract variable keys from a template string.
 */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const keys = new Set<string>();
  for (const m of matches) {
    keys.add(m[1]);
  }
  return Array.from(keys);
}

/**
 * Render a template by ID with the given context variables.
 */
export async function renderTemplate(
  templateId: string,
  context: RenderContext,
  language?: string
): Promise<RenderedContent> {
  const tmpl = await NotificationTemplate.findById(templateId).lean();
  if (!tmpl) {
    throw new Error(`Template ${templateId} not found`);
  }

  const useAr = language === 'ar';

  const subject = tmpl.subject
    ? interpolate(useAr && tmpl.subjectAr ? tmpl.subjectAr : tmpl.subject, context)
    : undefined;

  const body = interpolate(
    useAr && tmpl.bodyAr ? tmpl.bodyAr : tmpl.body,
    context
  );

  const bodyHtml = tmpl.bodyHtml
    ? interpolate(useAr && tmpl.bodyHtmlAr ? tmpl.bodyHtmlAr : tmpl.bodyHtml, context)
    : undefined;

  return { subject, body, bodyHtml };
}

/**
 * Render raw content (not from a template) with context variables.
 */
export function renderRawContent(
  content: { subject?: string; body?: string; bodyHtml?: string },
  context: RenderContext
): RenderedContent {
  return {
    subject: content.subject ? interpolate(content.subject, context) : undefined,
    body: content.body ? interpolate(content.body, context) : '',
    bodyHtml: content.bodyHtml ? interpolate(content.bodyHtml, context) : undefined,
  };
}

/**
 * Preview a template with sample data.
 */
export async function previewTemplate(
  templateId: string,
  sampleData?: RenderContext
): Promise<RenderedContent & { variables: string[] }> {
  const tmpl = await NotificationTemplate.findById(templateId).lean();
  if (!tmpl) {
    throw new Error(`Template ${templateId} not found`);
  }

  const allText = [tmpl.subject, tmpl.body, tmpl.bodyHtml, tmpl.subjectAr, tmpl.bodyAr, tmpl.bodyHtmlAr]
    .filter(Boolean)
    .join(' ');

  const variables = extractVariables(allText);

  // Build context with defaults + sample data
  const context: RenderContext = {};
  for (const v of tmpl.variables || []) {
    context[v.key] = v.defaultValue || `[${v.key}]`;
  }
  if (sampleData) {
    Object.assign(context, sampleData);
  }

  const rendered = await renderTemplate(templateId, context);
  return { ...rendered, variables };
}
