import { FilterQuery } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import SLA, { ISLA } from '../entities/SLA';
import { Priority } from '../types/itsm.types';

export class SLARepository extends BaseRepository<ISLA> {
  constructor() {
    super(SLA);
  }

  async findBySLAId(slaId: string): Promise<ISLA | null> {
    return this.model.findOne({ sla_id: slaId }).exec();
  }

  async findByPriority(priority: Priority): Promise<ISLA[]> {
    return this.model.find({ priority, is_active: true }).exec();
  }

  async findDefaultByPriority(priority: Priority): Promise<ISLA | null> {
    return this.model.findOne({ priority, is_default: true, is_active: true }).exec();
  }

  async findActiveSLAs(): Promise<ISLA[]> {
    return this.model.find({ is_active: true }).sort({ priority: 1 }).exec();
  }

  async findApplicableSLA(
    priority: Priority,
    categoryId?: string,
    siteId?: string
  ): Promise<ISLA | null> {
    // First try to find specific SLA for category or site
    if (categoryId || siteId) {
      const filter: FilterQuery<ISLA> = {
        priority,
        is_active: true,
        $or: [],
      };

      if (categoryId) {
        filter.$or!.push({ 'applies_to.categories': categoryId });
      }
      if (siteId) {
        filter.$or!.push({ 'applies_to.sites': siteId });
      }

      const specificSLA = await this.model.findOne(filter).exec();
      if (specificSLA) return specificSLA;
    }

    // Fall back to default SLA for priority
    return this.findDefaultByPriority(priority);
  }

  async setAsDefault(slaId: string, priority: Priority): Promise<ISLA | null> {
    // Remove default from other SLAs with same priority
    await this.model.updateMany(
      { priority, is_default: true },
      { is_default: false }
    );

    // Set this SLA as default
    return this.model
      .findOneAndUpdate(
        { sla_id: slaId },
        { is_default: true },
        { new: true }
      )
      .exec();
  }

  async getAllDefaults(): Promise<ISLA[]> {
    return this.model.find({ is_default: true, is_active: true }).sort({ priority: 1 }).exec();
  }
}

export default new SLARepository();
