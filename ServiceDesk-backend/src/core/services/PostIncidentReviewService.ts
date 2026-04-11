import PostIncidentReview, { IPIR } from '../entities/PostIncidentReview';
import Counter from '../entities/Counter';
import { PIRStatus, RCAMethod, IFollowUpAction, generatePIRId } from '../types/itsm.types';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export interface CreatePIRDTO {
  incident_id: string;
  owner: string;
  owner_name: string;
  incident_summary: string;
  impact_summary: string;
  timeline_summary?: string;
  participants?: { id: string; name: string; role: string }[];
}

export interface UpdatePIRDTO {
  root_cause_summary?: string;
  rca_method?: RCAMethod;
  contributing_factors?: string[];
  lessons_learned?: string;
  timeline_summary?: string;
  review_date?: Date;
  participants?: { id: string; name: string; role: string }[];
}

export class PostIncidentReviewService {
  async createPIR(data: CreatePIRDTO): Promise<IPIR> {
    const existing = await PostIncidentReview.findOne({ incident_id: data.incident_id });
    if (existing) {
      throw new ApiError(409, `PIR already exists for incident ${data.incident_id}`);
    }

    const pirId = await Counter.generateId('PIR');

    const pir = await PostIncidentReview.create({
      pir_id: pirId,
      incident_id: data.incident_id,
      status: PIRStatus.DRAFT,
      owner: data.owner,
      owner_name: data.owner_name,
      incident_summary: data.incident_summary,
      impact_summary: data.impact_summary,
      timeline_summary: data.timeline_summary || '',
      participants: data.participants || [],
      follow_up_actions: [],
      contributing_factors: [],
    });

    logger.info(`PIR created: ${pirId} for incident ${data.incident_id}`);
    return pir;
  }

  async getPIR(identifier: string): Promise<IPIR> {
    const pir = await PostIncidentReview.findOne({
      $or: [{ pir_id: identifier }, { incident_id: identifier }],
    });
    if (!pir) {
      throw new ApiError(404, `PIR not found: ${identifier}`);
    }
    return pir;
  }

  async updatePIR(pirId: string, data: UpdatePIRDTO, userId: string): Promise<IPIR> {
    const pir = await PostIncidentReview.findOne({ pir_id: pirId });
    if (!pir) throw new ApiError(404, `PIR not found: ${pirId}`);
    if (pir.status === PIRStatus.COMPLETED) {
      throw new ApiError(400, 'Cannot update a completed PIR');
    }

    Object.assign(pir, data);
    await pir.save();

    logger.info(`PIR updated: ${pirId}`, { updatedBy: userId });
    return pir;
  }

  async addFollowUpAction(
    pirId: string,
    action: Omit<IFollowUpAction, 'action_id' | 'completed' | 'completed_at'>,
    userId: string
  ): Promise<IPIR> {
    const pir = await PostIncidentReview.findOne({ pir_id: pirId });
    if (!pir) throw new ApiError(404, `PIR not found: ${pirId}`);
    if (pir.status === PIRStatus.COMPLETED) {
      throw new ApiError(400, 'Cannot add actions to a completed PIR');
    }

    const followUpAction: IFollowUpAction = {
      action_id: `ACT-${Date.now()}`,
      completed: false,
      ...action,
    };

    pir.follow_up_actions.push(followUpAction);
    await pir.save();

    logger.info(`Follow-up action added to PIR: ${pirId}`, { action: followUpAction.action_id });
    return pir;
  }

  async completeFollowUpAction(pirId: string, actionId: string, userId: string): Promise<IPIR> {
    const pir = await PostIncidentReview.findOne({ pir_id: pirId });
    if (!pir) throw new ApiError(404, `PIR not found: ${pirId}`);

    const action = pir.follow_up_actions.find((a) => a.action_id === actionId);
    if (!action) throw new ApiError(404, `Follow-up action not found: ${actionId}`);

    action.completed = true;
    action.completed_at = new Date();
    await pir.save();

    return pir;
  }

  async submitForReview(pirId: string, userId: string): Promise<IPIR> {
    const pir = await PostIncidentReview.findOne({ pir_id: pirId });
    if (!pir) throw new ApiError(404, `PIR not found: ${pirId}`);
    if (pir.status !== PIRStatus.DRAFT) {
      throw new ApiError(400, `PIR is not in draft status (current: ${pir.status})`);
    }

    pir.status = PIRStatus.IN_REVIEW;
    await pir.save();

    logger.info(`PIR submitted for review: ${pirId}`, { by: userId });
    return pir;
  }

  async completePIR(pirId: string, userId: string): Promise<IPIR> {
    const pir = await PostIncidentReview.findOne({ pir_id: pirId });
    if (!pir) throw new ApiError(404, `PIR not found: ${pirId}`);
    if (pir.status === PIRStatus.COMPLETED) {
      throw new ApiError(400, 'PIR is already completed');
    }
    if (!pir.root_cause_summary) {
      throw new ApiError(400, 'Root cause summary is required before completing PIR');
    }

    pir.status = PIRStatus.COMPLETED;
    pir.completed_at = new Date();
    await pir.save();

    logger.info(`PIR completed: ${pirId}`, { by: userId });
    return pir;
  }

  async listPIRs(filters: {
    status?: PIRStatus;
    owner?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IPIR[]; total: number; page: number; limit: number }> {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.owner) query.owner = filters.owner;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      PostIncidentReview.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
      PostIncidentReview.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }
}

export default new PostIncidentReviewService();
