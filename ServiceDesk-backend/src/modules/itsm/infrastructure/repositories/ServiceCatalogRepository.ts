/**
 * Service Catalog Repository
 *
 * Infrastructure layer — wraps the Mongoose model behind IRepository.
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { IServiceCatalogItem } from '../../models/ServiceCatalog';

let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/ServiceCatalog').ServiceCatalog;
  }
  return _model;
}

export class ServiceCatalogRepository extends MongoRepository<IServiceCatalogItem> {
  constructor() {
    super(getModel());
  }

  async findByCategory(category: string) {
    return this.findAll({ category });
  }

  async findActive() {
    return this.findAll({ isActive: true, status: 'active' });
  }
}
