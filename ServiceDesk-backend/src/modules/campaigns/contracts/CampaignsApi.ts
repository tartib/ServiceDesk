/**
 * Campaigns Internal API Facade
 */

import { ICampaignsApi } from '../../../shared/internal-api/types';
import UserPreference from '../models/UserPreference';

export class CampaignsApiImpl implements ICampaignsApi {
  readonly moduleName = 'campaigns';

  async sendCampaignMessage(campaignId: string, recipientId: string, channel: string): Promise<any> {
    // Delegate to campaign orchestrator when wired
    return { campaignId, recipientId, channel, status: 'queued' };
  }

  async getSegmentRecipients(segmentId: string, organizationId: string): Promise<string[]> {
    // Delegate to segment resolver when wired
    return [];
  }

  async getUserPreference(userId: string, organizationId: string): Promise<any | null> {
    return UserPreference.findOne({ userId, organizationId }).lean();
  }
}
