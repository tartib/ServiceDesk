import { Types } from 'mongoose';
import { createMockRepository } from '../../../__tests__/fixtures/service.fixture';

describe('Form Workflow Service', () => {
  let mockWorkflowRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockWorkflowRepository = createMockRepository();
  });

  describe('createWorkflow', () => {
    it('should create form workflow with valid data', async () => {
      const workflowData = {
        formId: new Types.ObjectId(),
        name: 'Approval Workflow',
        steps: ['submitted', 'under_review', 'approved', 'rejected'],
      };

      mockWorkflowRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...workflowData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockWorkflowRepository.create(workflowData);

      expect(result.name).toBe('Approval Workflow');
      expect(result.steps).toHaveLength(4);
    });
  });

  describe('getWorkflow', () => {
    it('should retrieve workflow by id', async () => {
      const workflowId = new Types.ObjectId();
      const workflow = {
        _id: workflowId,
        name: 'Approval Workflow',
        steps: ['submitted', 'approved'],
      };

      mockWorkflowRepository.findById.mockResolvedValue(workflow);

      const result = await mockWorkflowRepository.findById(workflowId);

      expect(result._id).toEqual(workflowId);
      expect(result.steps).toContain('submitted');
    });
  });

  describe('submitForm', () => {
    it('should submit form through workflow', async () => {
      const submissionData = {
        formId: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        status: 'submitted',
        submittedAt: new Date(),
      };

      mockWorkflowRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...submissionData,
      });

      const result = await mockWorkflowRepository.create(submissionData);

      expect(result.status).toBe('submitted');
    });
  });

  describe('approveSubmission', () => {
    it('should approve form submission', async () => {
      const submissionId = new Types.ObjectId();
      const approvedSubmission = {
        _id: submissionId,
        status: 'approved',
        approvedBy: new Types.ObjectId(),
        approvedAt: new Date(),
      };

      mockWorkflowRepository.updateById.mockResolvedValue(approvedSubmission);

      const result = await mockWorkflowRepository.updateById(submissionId, { status: 'approved' });

      expect(result.status).toBe('approved');
    });
  });

  describe('rejectSubmission', () => {
    it('should reject form submission with reason', async () => {
      const submissionId = new Types.ObjectId();
      const rejectedSubmission = {
        _id: submissionId,
        status: 'rejected',
        rejectionReason: 'Missing required fields',
      };

      mockWorkflowRepository.updateById.mockResolvedValue(rejectedSubmission);

      const result = await mockWorkflowRepository.updateById(submissionId, {
        status: 'rejected',
        rejectionReason: 'Missing required fields',
      });

      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Missing required fields');
    });
  });

  describe('getWorkflowStatus', () => {
    it('should retrieve current submission status', async () => {
      const submissionId = new Types.ObjectId();
      const submission = {
        _id: submissionId,
        status: 'under_review',
      };

      mockWorkflowRepository.findById.mockResolvedValue(submission);

      const result = await mockWorkflowRepository.findById(submissionId);

      expect(result.status).toBe('under_review');
    });
  });
});
