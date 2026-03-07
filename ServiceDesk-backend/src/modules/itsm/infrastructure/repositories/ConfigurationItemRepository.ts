/**
 * Configuration Item Repository
 *
 * Infrastructure layer — wraps the Mongoose model behind IRepository.
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { IConfigurationItem } from '../../models/ConfigurationItem';

let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/ConfigurationItem').ConfigurationItem;
  }
  return _model;
}

export class ConfigurationItemRepository extends MongoRepository<IConfigurationItem> {
  constructor() {
    super(getModel());
  }

  /**
   * Find by human-readable ciId (e.g., "CI-00042")
   */
  async findByCiId(ciId: string): Promise<IConfigurationItem | null> {
    return this.findOne({ ciId });
  }

  /**
   * Find by CI type
   */
  async findByType(ciType: string) {
    return this.findAll({ ciType });
  }

  /**
   * Find by status
   */
  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  /**
   * Soft-retire a CI
   */
  async retire(id: string): Promise<IConfigurationItem | null> {
    return this.updateById(id, { status: 'retired' } as any);
  }
}
