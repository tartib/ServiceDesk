/**
 * Workflow Definition Repository
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { Document } from 'mongoose';

let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/WorkflowDefinition').default;
  }
  return _model;
}

export class WorkflowDefinitionRepository extends MongoRepository<Document> {
  constructor() {
    super(getModel());
  }

  async findPublished() {
    return this.findAll({ status: 'published' });
  }

  async findByEntityType(entityType: string) {
    return this.findAll({ entityType, status: 'published' });
  }

  async findLatestVersion(name: string): Promise<Document | null> {
    return this.findOne({ name, status: 'published' }, { lean: true });
  }
}
