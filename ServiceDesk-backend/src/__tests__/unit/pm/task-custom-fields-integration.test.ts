/**
 * Integration-style tests for task create/update/read flows with custom fields.
 *
 * These tests mock Mongoose models at the module level and exercise the actual
 * controller code paths that validate, persist, merge, and return customFields.
 */

import { Response } from 'express';

// ── Shared mock state ───────────────────────────────────────────

let mockProject: Record<string, unknown> | null = null;
let savedTaskData: Record<string, unknown> | null = null;
let mockExistingTask: Record<string, unknown> | null = null;

// Helper: build a populate chain that resolves to `obj`
function populateChain(obj: unknown, depth = 7): any {
  if (depth <= 0) return Promise.resolve(obj);
  return { populate: jest.fn().mockReturnValue(populateChain(obj, depth - 1)) };
}

// ── Module mocks (before imports) ───────────────────────────────

jest.mock('../../../modules/pm/models/Project', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockImplementation(() => Promise.resolve(mockProject)),
  },
  MethodologyCode: { SCRUM: 'scrum', KANBAN: 'kanban', WATERFALL: 'waterfall', ITIL: 'itil', SAFe: 'safe', OKR: 'okr' },
  ProjectRole: { LEAD: 'lead', MANAGER: 'manager', CONTRIBUTOR: 'contributor', VIEWER: 'viewer' },
  ProjectStatus: { ACTIVE: 'active', ARCHIVED: 'archived', DELETED: 'deleted' },
  ProjectHealth: { GREEN: 'green', YELLOW: 'yellow', RED: 'red' },
  ProjectPriority: { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' },
}));

jest.mock('../../../modules/pm/models/Task', () => {
  // Must re-export enums that types/pm re-exports from this module
  const PMTaskType = { EPIC: 'epic', STORY: 'story', TASK: 'task', BUG: 'bug', SUBTASK: 'subtask', CHANGE_REQUEST: 'change_request' };
  const PMTaskPriority = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low', TRIVIAL: 'trivial' };
  const PMStatusCategory = { TODO: 'todo', IN_PROGRESS: 'in_progress', DONE: 'done' };

  // Constructor: new Task(data)
  function MockTask(this: any, data: Record<string, unknown>) {
    Object.assign(this, data, { _id: 'task-new' });
    this.save = jest.fn().mockImplementation(async () => {
      savedTaskData = { ...this };
      return this;
    });
    this.markModified = jest.fn();
  }

  // Static methods
  MockTask.findOne = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue({ number: 5 }),
  });

  MockTask.findById = jest.fn().mockImplementation((_id: string) => {
    const target = mockExistingTask || savedTaskData;
    if (!target) return Object.assign(Promise.resolve(null), populateChain(null));
    return Object.assign(Promise.resolve(target), populateChain(target));
  });

  MockTask.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  MockTask.find = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
  });

  return { __esModule: true, default: MockTask, PMTaskType, PMTaskPriority, PMStatusCategory };
});

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: jest.fn().mockImplementation((v: string) => v),
    },
  };
});

jest.mock('../../../modules/pm/models/Workflow', () => ({ __esModule: true, default: {} }));

jest.mock('../../../modules/pm/models/Activity', () => ({
  __esModule: true,
  default: { create: jest.fn().mockReturnValue({ catch: jest.fn() }) },
}));

jest.mock('../../../modules/pm/services/workflow.service', () => ({
  __esModule: true,
  default: {
    getOrCreateDefaultWorkflow: jest.fn().mockResolvedValue({
      statuses: [{ id: 'todo', name: 'To Do', category: 'todo' }],
    }),
    getInitialStatus: jest.fn().mockReturnValue({ id: 'todo', name: 'To Do', category: 'todo' }),
    getAvailableTransitions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../utils/pm/permissions', () => ({
  canCreateTask: jest.fn().mockReturnValue(true),
  canUpdateTask: jest.fn().mockReturnValue(true),
  canAssignTask: jest.fn().mockReturnValue(true),
  getTaskPermissions: jest.fn().mockReturnValue({
    canUpdate: true, canDelete: true, canAssign: true, canTransition: true,
  }),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../modules/pm/controllers/notificationHelper', () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
  notifyUsers: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../modules/pm/infrastructure/repositories', () => ({
  getPmRepos: jest.fn(),
  isPmPostgres: jest.fn().mockReturnValue(false),
}));

// ── Import controllers after all mocks ──────────────────────────

import { createTask, updateTask } from '../../../modules/pm/controllers/task.controller';

// ── Helpers ──────────────────────────────────────────────────────

function req(overrides: Record<string, unknown> = {}) {
  return {
    params: { projectId: 'proj-1', taskId: 'task-new' },
    body: {},
    user: { id: 'user1', email: 'a@b.com' },
    ...overrides,
  } as any;
}

function res() {
  const r: Partial<Response> = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r as Response;
}

function projectWith(fields: Record<string, unknown>[] = []) {
  return {
    _id: 'proj-1',
    key: 'TEST',
    organizationId: 'org-1',
    methodology: { code: 'scrum' },
    members: [{ userId: 'user1', role: 'owner' }],
    taskFieldDefinitions: fields,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  savedTaskData = null;
  mockExistingTask = null;
  mockProject = null;
});

// ── Tests ────────────────────────────────────────────────────────

describe('Task custom fields — controller integration', () => {

  // ── CREATE ──

  describe('createTask with custom fields', () => {
    it('creates task with valid custom fields', async () => {
      mockProject = projectWith([
        { id: 'mobile', name: 'Mobile', type: 'phone', position: 0 },
        { id: 'model', name: 'Model', type: 'text', position: 1 },
      ]);
      const r = res();
      await createTask(
        req({ body: { title: 'Test', customFields: { mobile: '+966500000000', model: 'iPhone 15' } } }),
        r,
      );
      expect(r.status).toHaveBeenCalledWith(201);
      expect(savedTaskData).toBeTruthy();
      expect((savedTaskData as any).customFields.mobile).toBe('+966500000000');
      expect((savedTaskData as any).customFields.model).toBe('iPhone 15');
    });

    it('rejects task with invalid custom field type', async () => {
      mockProject = projectWith([
        { id: 'cost', name: 'Cost', type: 'number', position: 0 },
      ]);
      const r = res();
      await createTask(
        req({ body: { title: 'Test', customFields: { cost: 'not-a-number' } } }),
        r,
      );
      expect(r.status).toHaveBeenCalledWith(400);
      const json = (r.json as jest.Mock).mock.calls[0][0];
      expect(json.error).toContain('Custom field validation failed');
      expect(json.errors).toBeDefined();
    });

    it('rejects task with unknown custom field key', async () => {
      mockProject = projectWith([
        { id: 'model', name: 'Model', type: 'text', position: 0 },
      ]);
      const r = res();
      await createTask(
        req({ body: { title: 'Test', customFields: { unknown_key: 'val' } } }),
        r,
      );
      expect(r.status).toHaveBeenCalledWith(400);
    });

    it('creates task without custom fields when project has no definitions', async () => {
      mockProject = projectWith([]);
      const r = res();
      await createTask(req({ body: { title: 'Test' } }), r);
      expect(r.status).toHaveBeenCalledWith(201);
      expect(savedTaskData).toBeTruthy();
      expect((savedTaskData as any).customFields).toEqual({});
    });

    it('creates task without sending customFields at all (backward compat)', async () => {
      mockProject = projectWith([
        { id: 'notes', name: 'Notes', type: 'text', position: 0 },
      ]);
      const r = res();
      await createTask(req({ body: { title: 'Test' } }), r);
      expect(r.status).toHaveBeenCalledWith(201);
      expect((savedTaskData as any).customFields).toEqual({});
    });

    it('applies default values for omitted fields', async () => {
      mockProject = projectWith([
        { id: 'env', name: 'Env', type: 'select', options: ['dev', 'prod'], defaultValue: 'dev', position: 0 },
      ]);
      const r = res();
      await createTask(req({ body: { title: 'Test', customFields: {} } }), r);
      expect(r.status).toHaveBeenCalledWith(201);
      expect((savedTaskData as any).customFields.env).toBe('dev');
    });
  });

  // ── UPDATE ──

  describe('updateTask with custom fields', () => {
    it('updates custom fields with merge strategy', async () => {
      mockProject = projectWith([
        { id: 'mobile', name: 'Mobile', type: 'phone', position: 0 },
        { id: 'model', name: 'Model', type: 'text', position: 1 },
      ]);
      mockExistingTask = {
        _id: 'task-new',
        projectId: 'proj-1',
        organizationId: 'org-1',
        type: 'task',
        key: 'TEST-1',
        title: 'Existing',
        assignee: 'user1',
        reporter: 'user1',
        customFields: { mobile: '+966500000000' },
        save: jest.fn().mockImplementation(async function (this: any) {
          savedTaskData = { ...this };
          return this;
        }),
        markModified: jest.fn(),
      };

      const r = res();
      await updateTask(
        req({ body: { customFields: { model: 'Galaxy S24' } } }),
        r,
      );
      expect(r.status).toHaveBeenCalledWith(200);
      expect((mockExistingTask as any).customFields).toEqual({
        mobile: '+966500000000',
        model: 'Galaxy S24',
      });
    });

    it('rejects invalid custom field on update', async () => {
      mockProject = projectWith([
        { id: 'cost', name: 'Cost', type: 'number', position: 0 },
      ]);
      mockExistingTask = {
        _id: 'task-new',
        projectId: 'proj-1',
        organizationId: 'org-1',
        type: 'task',
        key: 'TEST-1',
        title: 'Existing',
        assignee: 'user1',
        reporter: 'user1',
        customFields: {},
        save: jest.fn().mockResolvedValue(undefined),
        markModified: jest.fn(),
      };

      const r = res();
      await updateTask(
        req({ body: { customFields: { cost: 'not-a-number' } } }),
        r,
      );
      expect(r.status).toHaveBeenCalledWith(400);
      const json = (r.json as jest.Mock).mock.calls[0][0];
      expect(json.error).toContain('Custom field validation failed');
    });

    it('updates task without customFields (legacy client)', async () => {
      mockProject = projectWith([
        { id: 'mobile', name: 'Mobile', type: 'phone', position: 0 },
      ]);
      mockExistingTask = {
        _id: 'task-new',
        projectId: 'proj-1',
        organizationId: 'org-1',
        type: 'task',
        key: 'TEST-1',
        title: 'Old Title',
        assignee: 'user1',
        reporter: 'user1',
        customFields: { mobile: '+966500000000' },
        save: jest.fn().mockImplementation(async function (this: any) {
          savedTaskData = { ...this };
          return this;
        }),
        markModified: jest.fn(),
        updatedBy: undefined,
      };

      const r = res();
      await updateTask(
        req({ body: { title: 'New Title' } }),
        r,
      );
      expect(r.status).toHaveBeenCalledWith(200);
      expect((mockExistingTask as any).customFields).toEqual({ mobile: '+966500000000' });
    });
  });

  // ── BACKWARD COMPATIBILITY ──

  describe('backward compatibility', () => {
    it('project with no taskFieldDefinitions still allows task creation', async () => {
      mockProject = {
        _id: 'proj-1',
        key: 'TEST',
        organizationId: 'org-1',
        methodology: { code: 'scrum' },
        members: [{ userId: 'user1', role: 'owner' }],
      };
      const r = res();
      await createTask(req({ body: { title: 'Test' } }), r);
      expect(r.status).toHaveBeenCalledWith(201);
    });

    it('rejects custom fields when project has no definitions', async () => {
      mockProject = {
        _id: 'proj-1',
        key: 'TEST',
        organizationId: 'org-1',
        methodology: { code: 'scrum' },
        members: [{ userId: 'user1', role: 'owner' }],
      };
      const r = res();
      await createTask(
        req({ body: { title: 'Test', customFields: { rogue: 'data' } } }),
        r,
      );
      expect(r.status).toHaveBeenCalledWith(400);
    });
  });
});
