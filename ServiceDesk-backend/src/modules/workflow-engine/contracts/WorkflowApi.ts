/**
 * Workflow Engine Module — Internal API Facade
 *
 * Public contract for other modules to interact with the Workflow Engine.
 * Wraps the GenericWorkflowEngine singleton — consumers never import engine internals directly.
 */

import { IWorkflowApi } from '../../../shared/internal-api/types';

export class WorkflowApiImpl implements IWorkflowApi {
  readonly moduleName = 'workflow-engine';

  private get engine() {
    const { getWorkflowEngine } = require('../services/workflowEngineFactory');
    return getWorkflowEngine();
  }

  private get definitionService() {
    return require('../services/workflowDefinition.service').default;
  }

  private get instanceService() {
    return require('../services/workflowInstance.service').default;
  }

  async startWorkflow(
    definitionId: string,
    variables: Record<string, any>,
    userId: string
  ): Promise<any> {
    return this.engine.startWorkflow(definitionId, variables, userId);
  }

  async executeTransition(
    instanceId: string,
    transitionCode: string,
    userId: string,
    data?: Record<string, any>
  ): Promise<any> {
    return this.engine.executeTransition(instanceId, transitionCode, userId, data);
  }

  async getAvailableTransitions(instanceId: string, userId: string): Promise<any[]> {
    return this.engine.getAvailableTransitions(instanceId, userId);
  }

  async cancelWorkflow(instanceId: string, userId: string, reason?: string): Promise<any> {
    return this.engine.cancelWorkflow(instanceId, userId, reason);
  }

  async suspendWorkflow(instanceId: string, userId: string): Promise<any> {
    return this.engine.suspendWorkflow(instanceId, userId);
  }

  async resumeWorkflow(instanceId: string, userId: string): Promise<any> {
    return this.engine.resumeWorkflow(instanceId, userId);
  }

  async getWorkflowInstance(instanceId: string): Promise<any | null> {
    return this.instanceService.getById(instanceId);
  }

  async getWorkflowDefinition(definitionId: string): Promise<any | null> {
    return this.definitionService.getById(definitionId);
  }
}
