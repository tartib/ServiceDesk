'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AutosaveStatus } from '@/components/inventory/forms/types/inventory-form.types';

const AUTOSAVE_DELAY_MS = 2000;
const STORAGE_PREFIX = 'inv_draft_';

interface AutosaveOptions {
  formType: string;
  enabled?: boolean;
  /** Use API persistence instead of localStorage (future). */
  useApi?: boolean;
}

/**
 * Autosave hook for inventory forms.
 *
 * - Saves form data to localStorage after 2 seconds of inactivity.
 * - Restores draft data on mount.
 * - Provides status indicator (idle / saving / saved / error).
 */
export function useInventoryFormAutosave(options: AutosaveOptions) {
  const { formType, enabled = true } = options;
  const storageKey = `${STORAGE_PREFIX}${formType}`;

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef<Record<string, unknown> | null>(null);

  // ── Save ────────────────────────────────────────────────────────

  const saveDraft = useCallback(
    (data: Record<string, unknown>, currentStep: number) => {
      if (!enabled) return;

      latestData.current = data;

      // Debounce
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        try {
          setStatus('saving');
          const draft = {
            formType,
            currentStep,
            formData: data,
            lastSavedAt: new Date().toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(draft));
          setStatus('saved');
        } catch {
          setStatus('error');
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [enabled, formType, storageKey],
  );

  // ── Restore ─────────────────────────────────────────────────────

  const restoreDraft = useCallback((): {
    formData: Record<string, unknown>;
    currentStep: number;
  } | null => {
    if (!enabled) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      return { formData: draft.formData, currentStep: draft.currentStep ?? 0 };
    } catch {
      return null;
    }
  }, [enabled, storageKey]);

  // ── Discard ─────────────────────────────────────────────────────

  const discardDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStatus('idle');
  }, [storageKey]);

  // ── Has draft? ──────────────────────────────────────────────────

  const hasDraft = useCallback((): boolean => {
    return !!localStorage.getItem(storageKey);
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { status, saveDraft, restoreDraft, discardDraft, hasDraft };
}
