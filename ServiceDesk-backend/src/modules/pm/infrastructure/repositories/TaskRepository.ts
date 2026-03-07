/**
 * Task Repository
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { Document } from 'mongoose';

let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/Task').default;
  }
  return _model;
}

export class TaskRepository extends MongoRepository<Document> {
  constructor() {
    super(getModel());
  }

  async findByProject(projectId: string) {
    return this.findAll({ project: projectId });
  }

  async findBySprint(sprintId: string) {
    return this.findAll({ sprint: sprintId });
  }

  async findByAssignee(userId: string) {
    return this.findAll({ assignee: userId });
  }

  async findByKey(key: string): Promise<Document | null> {
    return this.findOne({ key });
  }
}
