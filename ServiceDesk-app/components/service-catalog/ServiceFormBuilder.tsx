'use client';

/**
 * ServiceFormBuilder — Solution Wrapper (Phase 1 refactor)
 *
 * This component is now a thin wrapper around the platform's
 * FormDefinitionBuilder. It must NOT import smart-forms builder
 * internals (FieldPalette, FieldEditor, FormCanvas) directly.
 *
 * Architecture rule (ADR 001): service-catalog consumes platform APIs only.
 */

import React from 'react';
import type { SmartField } from '@/lib/domains/forms';
import FormDefinitionBuilder from '@/components/forms-platform/FormDefinitionBuilder';

interface ServiceFormBuilderProps {
  fields: SmartField[];
  onChange: (fields: SmartField[]) => void;
  locale?: 'en' | 'ar';
}

export default function ServiceFormBuilder({
  fields,
  onChange,
  locale = 'en',
}: ServiceFormBuilderProps) {
  return (
    <FormDefinitionBuilder
      fields={fields}
      onChange={onChange}
      locale={locale}
      height={500}
    />
  );
}
