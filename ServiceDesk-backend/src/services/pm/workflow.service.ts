import Workflow, { IPMWorkflow, IWorkflowStatus, defaultWorkflows } from '../../models/pm/Workflow';
import Task from '../../models/pm/Task';
import { MethodologyCode, StatusCategory } from '../../types/pm';
import mongoose from 'mongoose';

class WorkflowService {
  async getOrCreateDefaultWorkflow(
    organizationId: string,
    methodology: MethodologyCode,
    userId: string
  ): Promise<IPMWorkflow> {
    let workflow = await Workflow.findOne({
      organizationId,
      methodology,
      isDefault: true,
    });

    if (!workflow) {
      const defaultConfig = defaultWorkflows[methodology];
      workflow = new Workflow({
        ...defaultConfig,
        organizationId,
        createdBy: userId,
      });
      await workflow.save();
    }

    return workflow;
  }

  async getProjectWorkflow(projectId: string): Promise<IPMWorkflow | null> {
    const workflow = await Workflow.findOne({ projectId });
    return workflow;
  }

  async getWorkflowByMethodology(
    organizationId: string,
    methodology: MethodologyCode
  ): Promise<IPMWorkflow | null> {
    return Workflow.findOne({
      organizationId,
      methodology,
      isDefault: true,
    });
  }

  getInitialStatus(workflow: IPMWorkflow): IWorkflowStatus {
    const initial = workflow.statuses.find((s: IWorkflowStatus) => s.isInitial);
    return initial || workflow.statuses[0];
  }

  async canTransition(
    taskId: string,
    toStatusId: string,
    _userId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const task = await Task.findById(taskId);
    if (!task) {
      return { allowed: false, reason: 'Task not found' };
    }

    const workflow = await Workflow.findOne({
      $or: [
        { projectId: task.projectId },
        { organizationId: task.organizationId, isDefault: true },
      ],
    }).sort({ projectId: -1 });

    if (!workflow) {
      return { allowed: false, reason: 'Workflow not found' };
    }

    // Check if target status exists in workflow
    const targetStatus = workflow.statuses.find(s => s.id === toStatusId);
    if (!targetStatus) {
      return {
        allowed: false,
        reason: `Target status ${toStatusId} not found in workflow`,
      };
    }

    const currentStatus = workflow.statuses.find(s => s.id === task.status.id);
    // Allow transition even if current status isn't in workflow (task may have old/default status)

    // Allow unrestricted transitions between any statuses in the workflow
    return { allowed: true };
  }

  private getValidTransitions(workflow: IPMWorkflow, currentStatus: IWorkflowStatus): IWorkflowStatus[] {
    // Check if explicit transitions are defined for this status
    const explicitTransitions = workflow.transitions.filter(t => t.fromStatus === currentStatus.id);
    
    if (explicitTransitions.length > 0) {
      // Use explicitly defined transitions
      const validStatusIds = explicitTransitions.map(t => t.toStatus);
      return workflow.statuses.filter(s => validStatusIds.includes(s.id));
    }

    // Default transition rules by status category
    switch (currentStatus.category) {
      case 'todo':
        // From TODO: can go to IN_PROGRESS or DONE
        return workflow.statuses.filter(s => 
          s.category === 'in_progress' || s.category === 'done'
        );
      case 'in_progress':
        // From IN_PROGRESS: can go to DONE or back to TODO
        return workflow.statuses.filter(s => 
          s.category === 'done' || s.category === 'todo'
        );
      case 'done':
        // From DONE: can go back to IN_PROGRESS (reopening)
        return workflow.statuses.filter(s => 
          s.category === 'in_progress'
        );
      default:
        // Allow transitions to any status
        return workflow.statuses.filter(s => s.id !== currentStatus.id);
    }
  }

  async transitionTask(
    taskId: string,
    toStatusId: string,
    userId: string,
    comment?: string
  ): Promise<typeof Task.prototype> {
    const canTransitionResult = await this.canTransition(taskId, toStatusId, userId);
    if (!canTransitionResult.allowed) {
      throw new Error(canTransitionResult.reason);
    }

    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const workflow = await Workflow.findOne({
      $or: [
        { projectId: task.projectId },
        { organizationId: task.organizationId, isDefault: true },
      ],
    }).sort({ projectId: -1 });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const newStatus = workflow.statuses.find((s) => s.id === toStatusId);
    if (!newStatus) {
      throw new Error('Status not found in workflow');
    }

    const fromStatus = task.status.id;

    task.status = {
      id: newStatus.id,
      name: newStatus.name,
      category: newStatus.category,
    };

    task.workflowHistory.push({
      fromStatus,
      toStatus: newStatus.id,
      changedBy: new mongoose.Types.ObjectId(userId),
      changedAt: new Date(),
      comment,
    });

    if (newStatus.category === StatusCategory.DONE) {
      task.completedAt = new Date();
    } else if (task.completedAt) {
      task.completedAt = undefined;
    }

    task.updatedBy = new mongoose.Types.ObjectId(userId);
    await task.save();

    return task;
  }

  async getAvailableTransitions(
    taskId: string
  ): Promise<{ id: string; name: string; toStatus: IWorkflowStatus }[]> {
    const task = await Task.findById(taskId);
    if (!task) {
      return [];
    }

    const workflow = await Workflow.findOne({
      $or: [
        { projectId: task.projectId },
        { organizationId: task.organizationId, isDefault: true },
      ],
    });

    if (!workflow) {
      return [];
    }

    // Return all statuses except current one as available transitions
    const currentStatusId = task.status.id;
    return workflow.statuses
      .filter(s => s.id !== currentStatusId)
      .map(status => ({
        id: `transition-to-${status.id}`,
        name: `Move to ${status.name}`,
        toStatus: status
      }));
  }

  async createCustomWorkflow(
    organizationId: string,
    projectId: string | undefined,
    data: Partial<IPMWorkflow>,
    userId: string
  ): Promise<IPMWorkflow> {
    const workflow = new Workflow({
      ...data,
      organizationId,
      projectId,
      createdBy: userId,
      isDefault: false,
    });

    await workflow.save();
    return workflow;
  }
}

export default new WorkflowService();
