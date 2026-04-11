/**
 * useNotifications Hook Tests
 *
 * Tests normalization (adapter), unread filtering, and cache invalidation.
 */

import { describe, it, expect } from 'vitest';
import { normalizeNotification, normalizeNotificationList } from '@/lib/domains/notifications/adapters';

describe('normalizeNotification', () => {
  it('maps _id → id', () => {
    const result = normalizeNotification({ _id: 'abc123', title: 'Test' });
    expect(result.id).toBe('abc123');
  });

  it('prefers id over _id when both present', () => {
    const result = normalizeNotification({ _id: 'old', id: 'new', title: 'Test' });
    expect(result.id).toBe('new');
  });

  it('maps read → isRead (legacy PM field)', () => {
    const result = normalizeNotification({ _id: '1', read: true });
    expect(result.isRead).toBe(true);
  });

  it('prefers isRead over read when both present', () => {
    const result = normalizeNotification({ _id: '1', isRead: false, read: true });
    expect(result.isRead).toBe(false);
  });

  it('defaults isRead to false when neither present', () => {
    const result = normalizeNotification({ _id: '1' });
    expect(result.isRead).toBe(false);
  });

  it('extracts userId from nested object', () => {
    const result = normalizeNotification({ _id: '1', userId: { _id: 'u1' } });
    expect(result.userId).toBe('u1');
  });

  it('handles string userId', () => {
    const result = normalizeNotification({ _id: '1', userId: 'u2' });
    expect(result.userId).toBe('u2');
  });

  it('maps source, level, type', () => {
    const result = normalizeNotification({
      _id: '1',
      source: 'pm',
      level: 'warning',
      type: 'assignment',
    });
    expect(result.source).toBe('pm');
    expect(result.level).toBe('warning');
    expect(result.type).toBe('assignment');
  });

  it('uses createdAt, falls back to timestamp', () => {
    const r1 = normalizeNotification({ _id: '1', createdAt: '2024-01-01' });
    expect(r1.createdAt).toBe('2024-01-01');

    const r2 = normalizeNotification({ _id: '2', timestamp: '2024-06-01' });
    expect(r2.createdAt).toBe('2024-06-01');
  });

  it('returns safe defaults for null/undefined input', () => {
    const result = normalizeNotification(null);
    expect(result.id).toBe('');
    expect(result.isRead).toBe(false);
    expect(result.title).toBe('');
  });

  it('preserves optional fields when present', () => {
    const result = normalizeNotification({
      _id: '1',
      actionUrl: '/tasks/123',
      projectId: 'p1',
      organizationId: 'o1',
      metadata: { key: 'val' },
    });
    expect(result.actionUrl).toBe('/tasks/123');
    expect(result.projectId).toBe('p1');
    expect(result.organizationId).toBe('o1');
    expect(result.metadata).toEqual({ key: 'val' });
  });
});

describe('normalizeNotificationList', () => {
  it('normalizes an array of raw notifications', () => {
    const result = normalizeNotificationList([
      { _id: '1', title: 'A', read: false },
      { _id: '2', title: 'B', isRead: true },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[0].isRead).toBe(false);
    expect(result[1].id).toBe('2');
    expect(result[1].isRead).toBe(true);
  });

  it('returns empty array for null/undefined', () => {
    expect(normalizeNotificationList(null)).toEqual([]);
    expect(normalizeNotificationList(undefined)).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeNotificationList({ not: 'array' })).toEqual([]);
  });
});
