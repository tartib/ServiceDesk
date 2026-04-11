/**
 * Segment Resolver — evaluates segment rules against User collection
 */

import mongoose from 'mongoose';
import Segment from '../models/Segment';
import { SegmentOperator, SegmentLogicGroup } from '../domain/enums';
import logger from '../../../utils/logger';

// Reference the User model (registered elsewhere)
function getUserModel() {
  return mongoose.model('User');
}

/**
 * Build a MongoDB filter from a single segment rule.
 */
function buildRuleFilter(rule: {
  field: string;
  customFieldKey?: string;
  operator: string;
  value: unknown;
}): Record<string, unknown> {
  const fieldPath = rule.customFieldKey
    ? `metadata.${rule.customFieldKey}`
    : rule.field;

  switch (rule.operator) {
    case SegmentOperator.EQUALS:
      return { [fieldPath]: rule.value };
    case SegmentOperator.NOT_EQUALS:
      return { [fieldPath]: { $ne: rule.value } };
    case SegmentOperator.CONTAINS:
      return { [fieldPath]: { $regex: String(rule.value), $options: 'i' } };
    case SegmentOperator.NOT_CONTAINS:
      return { [fieldPath]: { $not: { $regex: String(rule.value), $options: 'i' } } };
    case SegmentOperator.GREATER_THAN:
      return { [fieldPath]: { $gt: rule.value } };
    case SegmentOperator.LESS_THAN:
      return { [fieldPath]: { $lt: rule.value } };
    case SegmentOperator.GREATER_THAN_OR_EQUAL:
      return { [fieldPath]: { $gte: rule.value } };
    case SegmentOperator.LESS_THAN_OR_EQUAL:
      return { [fieldPath]: { $lte: rule.value } };
    case SegmentOperator.IN:
      return { [fieldPath]: { $in: Array.isArray(rule.value) ? rule.value : [rule.value] } };
    case SegmentOperator.NOT_IN:
      return { [fieldPath]: { $nin: Array.isArray(rule.value) ? rule.value : [rule.value] } };
    case SegmentOperator.EXISTS:
      return { [fieldPath]: { $exists: true, $ne: null } };
    case SegmentOperator.NOT_EXISTS:
      return { [fieldPath]: { $exists: false } };
    case SegmentOperator.BEFORE:
      return { [fieldPath]: { $lt: new Date(String(rule.value)) } };
    case SegmentOperator.AFTER:
      return { [fieldPath]: { $gt: new Date(String(rule.value)) } };
    case SegmentOperator.BETWEEN:
      if (Array.isArray(rule.value) && rule.value.length === 2) {
        return {
          [fieldPath]: { $gte: rule.value[0], $lte: rule.value[1] },
        };
      }
      return {};
    default:
      return {};
  }
}

/**
 * Evaluate a segment and return matching user IDs.
 */
export async function resolveSegment(
  segmentId: string,
  organizationId: string,
  options?: { limit?: number; skip?: number }
): Promise<{ userIds: string[]; total: number }> {
  const segment = await Segment.findById(segmentId).lean();
  if (!segment) {
    throw new Error(`Segment ${segmentId} not found`);
  }

  const andFilters: Record<string, unknown>[] = [];
  const orFilters: Record<string, unknown>[] = [];

  for (const rule of segment.rules) {
    const filter = buildRuleFilter({
      field: rule.field,
      customFieldKey: rule.customFieldKey,
      operator: rule.operator,
      value: rule.value,
    });
    if (Object.keys(filter).length === 0) continue;

    if (rule.logicGroup === SegmentLogicGroup.OR) {
      orFilters.push(filter);
    } else {
      andFilters.push(filter);
    }
  }

  // Build combined query
  const baseFilter: Record<string, unknown> = {
    is_active: true,
  };

  const conditions: Record<string, unknown>[] = [baseFilter, ...andFilters];
  if (orFilters.length > 0) {
    conditions.push({ $or: orFilters });
  }

  const query = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};

  const User = getUserModel();
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('_id')
    .skip(options?.skip || 0)
    .limit(options?.limit || 10000)
    .lean();

  const userIds = users.map((u: any) => String(u._id));

  // Update estimated count
  await Segment.findByIdAndUpdate(segmentId, {
    estimatedCount: total,
    lastEvaluatedAt: new Date(),
  });

  return { userIds, total };
}

/**
 * Preview segment count without returning IDs.
 */
export async function previewSegmentCount(
  segmentId: string,
  organizationId: string
): Promise<{ estimatedCount: number }> {
  const result = await resolveSegment(segmentId, organizationId, { limit: 0 });
  return { estimatedCount: result.total };
}

/**
 * Preview segment count from raw rules (before saving).
 */
export async function previewRulesCount(
  rules: Array<{
    field: string;
    customFieldKey?: string;
    operator: string;
    value: unknown;
    logicGroup: string;
  }>
): Promise<{ estimatedCount: number }> {
  const andFilters: Record<string, unknown>[] = [];
  const orFilters: Record<string, unknown>[] = [];

  for (const rule of rules) {
    const filter = buildRuleFilter(rule);
    if (Object.keys(filter).length === 0) continue;
    if (rule.logicGroup === SegmentLogicGroup.OR) {
      orFilters.push(filter);
    } else {
      andFilters.push(filter);
    }
  }

  const baseFilter: Record<string, unknown> = { is_active: true };
  const conditions: Record<string, unknown>[] = [baseFilter, ...andFilters];
  if (orFilters.length > 0) {
    conditions.push({ $or: orFilters });
  }

  const query = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};

  const User = getUserModel();
  const estimatedCount = await User.countDocuments(query);
  return { estimatedCount };
}
