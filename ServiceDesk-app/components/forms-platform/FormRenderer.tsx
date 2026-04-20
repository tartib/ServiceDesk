'use client';

/**
 * FormRenderer — Platform Re-export
 *
 * Canonical import path for the form renderer. Pages under app/(dashboard)/**
 * must import from here rather than directly from components/smart-forms/FormRenderer.
 *
 * Architecture (ADR 001):
 *   ALLOWED:   import FormRenderer from '@/components/forms-platform/FormRenderer'
 *   FORBIDDEN: import FormRenderer from '@/components/smart-forms/FormRenderer'
 */

export { default } from '@/components/smart-forms/FormRenderer';
