/**
 * Workflow Instance Repository
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { Document } from 'mongoose';

let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/WorkflowInstance').default;
  }
  return _model;
}

export class WorkflowInstanceRepository extends MongoRepository<Document> {
  constructor() {
    super(getModel());
  }

  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  async findByEntity(entityType: string, entityId: string): Promise<Document | null> {
    return this.findOne({ entityType, entityId });
  }

  async findActiveByDefinition(definitionId: string) {
    return this.findAll({ definitionId, status: 'active' });
  }
}
