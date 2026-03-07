/**
 * Service Request Repository
 *
 * Infrastructure layer — wraps the Mongoose model behind IRepository.
 * Business logic in controllers/services should depend on the repository
 * interface, not on Mongoose directly.
 */

import { MongoRepository } from '../../../../shared/database/MongoRepository';
import { IServiceRequest } from '../../models/ServiceRequest';

// Lazy-load model to avoid circular dependency at import time
let _model: any = null;
function getModel() {
  if (!_model) {
    _model = require('../../models/ServiceRequest').ServiceRequest;
  }
  return _model;
}

export class ServiceRequestRepository extends MongoRepository<IServiceRequest> {
  constructor() {
    super(getModel());
  }

  /**
   * Find by human-readable requestId (e.g., "SR-00042")
   */
  async findByRequestId(requestId: string): Promise<IServiceRequest | null> {
    return this.findOne({ requestId });
  }

  /**
   * Find all requests for a specific requester
   */
  async findByRequester(userId: string) {
    return this.findAll({ 'requester.userId': userId });
  }

  /**
   * Find requests by status
   */
  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  /**
   * Soft-cancel a request
   */
  async cancel(id: string, userId: string, reason?: string): Promise<IServiceRequest | null> {
    return this.updateById(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: reason,
    } as any);
  }
}
