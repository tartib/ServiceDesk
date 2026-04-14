/**
 * EntityServiceAdapter
 *
 * Bridges IWFEntityService → Mongoose models for ITSM + PM entities.
 * Used by ActionExecutor for UPDATE_ENTITY actions.
 */

import mongoose from 'mongoose';
import type { IWFEntityService } from '../engine/ActionExecutor';
import logger from '../../../utils/logger';

// Lazy model resolution to avoid circular imports at module load time
function getModel(entityType: string): mongoose.Model<any> | null {
  const map: Record<string, string> = {
    incident: 'Incident',
    problem: 'Problem',
    change: 'Change',
    service_request: 'ServiceRequest',
    task: 'Task',
  };
  const modelName = map[entityType];
  if (!modelName) return null;
  try {
    return mongoose.model(modelName);
  } catch {
    logger.warn(`[EntityServiceAdapter] Model "${modelName}" not registered`);
    return null;
  }
}

const SUPPORTED_TYPES = ['incident', 'problem', 'change', 'service_request', 'task'];

export class EntityServiceAdapter implements IWFEntityService {
  async updateEntity(
    entityType: string,
    entityId: string,
    updates: Record<string, any>,
  ): Promise<void> {
    const model = getModel(entityType);
    if (!model) {
      throw new Error(
        `[EntityServiceAdapter] Unsupported entity type "${entityType}". Supported: ${SUPPORTED_TYPES.join(', ')}`,
      );
    }

    const result = await model.findByIdAndUpdate(entityId, { $set: updates }, { new: true });
    if (!result) {
      throw new Error(`[EntityServiceAdapter] Entity ${entityType}:${entityId} not found`);
    }

    logger.info(`[EntityServiceAdapter] Updated ${entityType}:${entityId}`, { fields: Object.keys(updates) });
  }

  async getEntity(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, any> | null> {
    const model = getModel(entityType);
    if (!model) {
      throw new Error(
        `[EntityServiceAdapter] Unsupported entity type "${entityType}". Supported: ${SUPPORTED_TYPES.join(', ')}`,
      );
    }

    return model.findById(entityId).lean();
  }
}
