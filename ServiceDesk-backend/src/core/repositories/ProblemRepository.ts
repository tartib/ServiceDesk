import { FilterQuery } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import Problem, { IProblem } from '../entities/Problem';
import { ProblemStatus } from '../types/itsm.types';

export class ProblemRepository extends BaseRepository<IProblem> {
  constructor() {
    super(Problem);
  }

  async findByProblemId(problemId: string): Promise<IProblem | null> {
    return this.model.findOne({ problem_id: problemId }).exec();
  }

  async findByOwner(ownerId: string): Promise<IProblem[]> {
    return this.model.find({ 'owner.id': ownerId }).sort({ created_at: -1 }).exec();
  }

  async findBySite(siteId: string, status?: ProblemStatus[]): Promise<IProblem[]> {
    const filter: FilterQuery<IProblem> = { site_id: siteId };
    if (status && status.length > 0) {
      filter.status = { $in: status };
    }
    return this.model.find(filter).sort({ created_at: -1 }).exec();
  }

  async findOpenProblems(): Promise<IProblem[]> {
    return this.model
      .find({
        status: { $in: [ProblemStatus.LOGGED, ProblemStatus.RCA_IN_PROGRESS] },
      })
      .sort({ priority: -1, created_at: -1 })
      .exec();
  }

  async findKnownErrors(): Promise<IProblem[]> {
    return this.model
      .find({ status: ProblemStatus.KNOWN_ERROR })
      .sort({ created_at: -1 })
      .exec();
  }

  async findByLinkedIncident(incidentId: string): Promise<IProblem[]> {
    return this.model.find({ linked_incidents: incidentId }).exec();
  }

  async linkIncident(problemId: string, incidentId: string): Promise<IProblem | null> {
    return this.model
      .findOneAndUpdate(
        { problem_id: problemId },
        {
          $addToSet: { linked_incidents: incidentId },
          $push: {
            timeline: {
              event: `Incident ${incidentId} linked`,
              by: 'system',
              time: new Date(),
            },
          },
        },
        { new: true }
      )
      .exec();
  }

  async updateRootCause(
    problemId: string,
    rootCause: string,
    workaround: string,
    userId: string,
    userName: string
  ): Promise<IProblem | null> {
    return this.model
      .findOneAndUpdate(
        { problem_id: problemId },
        {
          root_cause: rootCause,
          workaround,
          status: ProblemStatus.RCA_IN_PROGRESS,
          $push: {
            timeline: {
              event: 'Root Cause Analysis Updated',
              by: userId,
              by_name: userName,
              time: new Date(),
              details: { root_cause: rootCause },
            },
          },
        },
        { new: true }
      )
      .exec();
  }

  async markAsKnownError(
    problemId: string,
    knownError: {
      ke_id: string;
      title: string;
      symptoms: string;
      root_cause: string;
      workaround: string;
      documented_by: string;
    },
    userId: string,
    userName: string
  ): Promise<IProblem | null> {
    return this.model
      .findOneAndUpdate(
        { problem_id: problemId },
        {
          status: ProblemStatus.KNOWN_ERROR,
          known_error: {
            ...knownError,
            documented_at: new Date(),
          },
          $push: {
            timeline: {
              event: 'Marked as Known Error',
              by: userId,
              by_name: userName,
              time: new Date(),
              details: { ke_id: knownError.ke_id },
            },
          },
        },
        { new: true }
      )
      .exec();
  }

  async getProblemStats(siteId?: string): Promise<{
    total: number;
    logged: number;
    rcaInProgress: number;
    knownErrors: number;
    resolved: number;
  }> {
    const baseFilter: FilterQuery<IProblem> = siteId ? { site_id: siteId } : {};

    const [total, logged, rcaInProgress, knownErrors, resolved] = await Promise.all([
      this.model.countDocuments(baseFilter),
      this.model.countDocuments({ ...baseFilter, status: ProblemStatus.LOGGED }),
      this.model.countDocuments({ ...baseFilter, status: ProblemStatus.RCA_IN_PROGRESS }),
      this.model.countDocuments({ ...baseFilter, status: ProblemStatus.KNOWN_ERROR }),
      this.model.countDocuments({ ...baseFilter, status: ProblemStatus.RESOLVED }),
    ]);

    return { total, logged, rcaInProgress, knownErrors, resolved };
  }
}

export default new ProblemRepository();
