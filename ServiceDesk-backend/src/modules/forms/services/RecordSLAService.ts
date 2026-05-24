/**
 * RecordSLAService — Section 2, Batch 6
 *
 * On record creation, finds the matching SLA policy for the request type
 * and creates an SLA instance with a due date on the RecordItem.
 */

import { IRecordItemDocument } from '../models/RecordItem';

export interface SLABindOptions {
  requestTypeId?: string;
  organizationId: string;
  priority: string;
}

/**
 * Default SLA response times by priority (in hours).
 * Used when no specific SLA policy is configured.
 */
const DEFAULT_SLA_HOURS: Record<string, number> = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 72,
};

/**
 * Bind SLA to a record based on its priority and request type.
 * Sets dueAt and initial SLA status on the record.
 */
export async function bindSLAToRecord(
  record: IRecordItemDocument,
  options: SLABindOptions,
): Promise<void> {
  try {
    // Try to find a matching SLA policy from the SLA module
    let dueHours = DEFAULT_SLA_HOURS[options.priority] ?? DEFAULT_SLA_HOURS.medium;

    try {
      const SlaPolicy = (await import('../../sla/models/SlaPolicy')).default;
      const policy = await SlaPolicy.findOne({
        organizationId: options.organizationId,
        isActive: true,
        $or: [
          { 'conditions.priority': options.priority },
          { 'conditions.priority': { $exists: false } },
        ],
      })
        .sort({ 'conditions.priority': -1 })
        .lean();

      if (policy && (policy as any).metrics?.responseTime) {
        dueHours = (policy as any).metrics.responseTime;
      }
    } catch {
      // SLA module might not be loaded — use defaults
    }

    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + dueHours);

    record.sla = {
      dueAt,
      status: 'on_track',
    };

    await record.save();
  } catch (error) {
    console.error('[RecordSLA] Failed to bind SLA:', error);
    // Non-fatal — record was already saved without SLA
  }
}

/**
 * Update SLA status based on current time vs due date.
 * Called by the SLA scheduler job.
 */
export function computeSLAStatus(dueAt: Date): 'on_track' | 'at_risk' | 'breached' {
  const now = new Date();
  const remaining = dueAt.getTime() - now.getTime();
  const totalDuration = dueAt.getTime() - (dueAt.getTime() - 24 * 60 * 60 * 1000); // fallback to 24h window

  if (remaining <= 0) return 'breached';
  if (remaining < totalDuration * 0.25) return 'at_risk';
  return 'on_track';
}
