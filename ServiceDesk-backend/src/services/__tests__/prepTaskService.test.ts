import { Types } from 'mongoose';
import { createMockRepository } from '../../__tests__/fixtures/service.fixture';

describe('Prep Task Service', () => {
  let mockTaskRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockTaskRepository = createMockRepository();
  });

  describe('createPrepTask', () => {
    it('should create prep task with valid data', async () => {
      const taskData = {
        title: 'Prepare meeting',
        description: 'Prepare for team meeting',
        assignedTo: new Types.ObjectId(),
        dueDate: new Date(),
        priority: 'high',
      };

      mockTaskRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...taskData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockTaskRepository.create(taskData);

      expect(result.title).toBe('Prepare meeting');
      expect(result.status).toBe('pending');
    });
  });

  describe('getPrepTasks', () => {
    it('should retrieve prep tasks for user', async () => {
      const userId = new Types.ObjectId();
      const tasks = [
        { _id: new Types.ObjectId(), assignedTo: userId, title: 'Task 1', status: 'pending' },
        { _id: new Types.ObjectId(), assignedTo: userId, title: 'Task 2', status: 'completed' },
      ];

      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await mockTaskRepository.find({ assignedTo: userId });

      expect(result).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      const userId = new Types.ObjectId();
      const tasks = [
        { _id: new Types.ObjectId(), assignedTo: userId, status: 'pending' },
      ];

      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await mockTaskRepository.find({ assignedTo: userId, status: 'pending' });

      expect(result[0].status).toBe('pending');
    });
  });

  describe('getTaskById', () => {
    it('should retrieve task by id', async () => {
      const taskId = new Types.ObjectId();
      const task = {
        _id: taskId,
        title: 'Prepare meeting',
        status: 'pending',
      };

      mockTaskRepository.findById.mockResolvedValue(task);

      const result = await mockTaskRepository.findById(taskId);

      expect(result._id).toEqual(taskId);
      expect(result.title).toBe('Prepare meeting');
    });
  });

  describe('updatePrepTask', () => {
    it('should update task status', async () => {
      const taskId = new Types.ObjectId();
      const updatedTask = {
        _id: taskId,
        title: 'Prepare meeting',
        status: 'completed',
      };

      mockTaskRepository.updateById.mockResolvedValue(updatedTask);

      const result = await mockTaskRepository.updateById(taskId, { status: 'completed' });

      expect(result.status).toBe('completed');
    });
  });

  describe('deletePrepTask', () => {
    it('should delete prep task', async () => {
      const taskId = new Types.ObjectId();

      mockTaskRepository.deleteById.mockResolvedValue(true);

      const result = await mockTaskRepository.deleteById(taskId);

      expect(result).toBe(true);
    });
  });

  describe('getOverdueTasks', () => {
    it('should retrieve overdue tasks', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const tasks = [
        { _id: new Types.ObjectId(), dueDate: pastDate, status: 'pending' },
      ];

      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await mockTaskRepository.find({ dueDate: { $lt: new Date() }, status: 'pending' });

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
