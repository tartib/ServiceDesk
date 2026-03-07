/**
 * Project Repository
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { Document } from 'mongoose';

let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/Project').default;
  }
  return _model;
}

export class ProjectRepository extends MongoRepository<Document> {
  constructor() {
    super(getModel());
  }

  async findByOrganization(orgId: string) {
    return this.findAll({ organization: orgId });
  }

  async findByKey(key: string): Promise<Document | null> {
    return this.findOne({ key });
  }

  async findByOwner(userId: string) {
    return this.findAll({ owner: userId });
  }

  async archive(id: string): Promise<Document | null> {
    return this.updateById(id, { status: 'archived' } as any);
  }
}
