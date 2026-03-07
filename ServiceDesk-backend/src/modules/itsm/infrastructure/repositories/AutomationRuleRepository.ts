/**
 * Automation Rule Repository
 *
 * Infrastructure layer — wraps the Mongoose model behind IRepository.
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { IAutomationRule } from '../../models/AutomationRule';

let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/AutomationRule').AutomationRule;
  }
  return _model;
}

export class AutomationRuleRepository extends MongoRepository<IAutomationRule> {
  constructor() {
    super(getModel());
  }

  async findByRuleId(ruleId: string): Promise<IAutomationRule | null> {
    return this.findOne({ ruleId });
  }

  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  async findActiveRules() {
    return this.findAll({ status: 'active', isValid: true });
  }

  async deactivate(id: string): Promise<IAutomationRule | null> {
    return this.updateById(id, { status: 'inactive' } as any);
  }
}
