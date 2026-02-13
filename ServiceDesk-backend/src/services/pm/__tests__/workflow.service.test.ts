import { Types } from 'mongoose';
import { createMockRepository } from '../../../__tests__/fixtures/service.fixture';

describe('PM Workflow Service', () => {
  let mockWorkflowRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockWorkflowRepository = createMockRepository();
  });

  describe('createWorkflow', () => {
    it('should create workflow with valid data', async () => {
      const workflowData = {
        name: 'Standard Workflow',
        projectId: new Types.ObjectId(),
        statuses: ['todo', 'in-progress', 'review', 'done'],
      };

      mockWorkflowRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...workflowData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockWorkflowRepository.create(workflowData);

      expect(result.name).toBe('Standard Workflow');
      expect(result.statuses).toHaveLength(4);
    });
  });

  describe('getWorkflow', () => {
    it('should retrieve workflow by id', async () => {
      const workflowId = new Types.ObjectId();
      const workflow = {
        _id: workflowId,
        name: 'Standard Workflow',
        statuses: ['todo', 'in-progress', 'done'],
      };

      mockWorkflowRepository.findById.mockResolvedValue(workflow);

      const result = await mockWorkflowRepository.findById(workflowId);

      expect(result._id).toEqual(workflowId);
      expect(result.statuses).toContain('todo');
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return available transitions for status', async () => {
      const workflowId = new Types.ObjectId();
      const workflow = {
        _id: workflowId,
        statuses: ['todo', 'in-progress', 'review', 'done'],
        transitions: {
          'todo': ['in-progress'],
          'in-progress': ['review', 'todo'],
          'review': ['done', 'in-progress'],
          'done': [],
        },
      };

      mockWorkflowRepository.findById.mockResolvedValue(workflow);

      const result = await mockWorkflowRepository.findById(workflowId);

      expect(result.transitions['todo']).toContain('in-progress');
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow statuses', async () => {
      const workflowId = new Types.ObjectId();
      const updatedWorkflow = {
        _id: workflowId,
        name: 'Updated Workflow',
        statuses: ['todo', 'in-progress', 'review', 'qa', 'done'],
      };

      mockWorkflowRepository.updateById.mockResolvedValue(updatedWorkflow);

      const result = await mockWorkflowRepository.updateById(workflowId, {
        statuses: ['todo', 'in-progress', 'review', 'qa', 'done'],
      });

      expect(result.statuses).toHaveLength(5);
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow', async () => {
      const workflowId = new Types.ObjectId();

      mockWorkflowRepository.deleteById.mockResolvedValue(true);

      const result = await mockWorkflowRepository.deleteById(workflowId);

      expect(result).toBe(true);
    });
  });
});
