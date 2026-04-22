/**
 * Unit tests for project-task-fields.controller.ts
 *
 * Covers: create, update, archive, reorder, duplicate-id rejection,
 * select-requires-options, invalid-type rejection.
 */

import { Response } from 'express';
import {
  listTaskFields,
  createTaskField,
  updateTaskField,
  archiveTaskField,
  reorderTaskFields,
} from '../../../modules/pm/controllers/project-task-fields.controller';

// ── Mocks ────────────────────────────────────────────────────────

const mockSave = jest.fn().mockResolvedValue(undefined);
const mockMarkModified = jest.fn();

let mockProject: Record<string, unknown> | null = null;

jest.mock('../../../modules/pm/models/Project', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(() => ({
      select: jest.fn().mockImplementation(() => Promise.resolve(mockProject)),
      then: (fn: (v: unknown) => void) => Promise.resolve(mockProject).then(fn),
    })),
  },
}));

// Re-import so we can override findById per-test
import Project from '../../../modules/pm/models/Project';

jest.mock('../../../utils/pm/permissions', () => ({
  canUpdateProject: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

// ── Helpers ──────────────────────────────────────────────────────

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    params: { projectId: '507f1f77bcf86cd799439011' },
    body: {},
    user: { id: 'user1', email: 'a@b.com' },
    ...overrides,
  } as any;
}

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function buildProject(fields: Record<string, unknown>[] = []) {
  return {
    _id: '507f1f77bcf86cd799439011',
    members: [{ userId: 'user1', role: 'owner' }],
    taskFieldDefinitions: fields,
    save: mockSave,
    markModified: mockMarkModified,
  };
}

// Override findById to return the full project (not just .select())
function setFindById(proj: Record<string, unknown> | null) {
  mockProject = proj;
  (Project.findById as jest.Mock).mockImplementation(() => {
    // For listTaskFields which chains .select()
    const obj = {
      select: jest.fn().mockResolvedValue(proj),
      then: (fn: (v: unknown) => void) => Promise.resolve(proj).then(fn),
    };
    // Also make it resolve directly for controllers that await findById() without .select()
    return Object.assign(Promise.resolve(proj), obj);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockProject = null;
});

// ── Tests ────────────────────────────────────────────────────────

describe('project-task-fields controller', () => {

  // ── List ──
  describe('listTaskFields', () => {
    it('returns field definitions', async () => {
      const proj = buildProject([{ id: 'mobile', name: 'Mobile', type: 'phone', position: 0, archived: false }]);
      setFindById(proj);
      const req = mockReq();
      const res = mockRes();
      await listTaskFields(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { fields: proj.taskFieldDefinitions } }),
      );
    });

    it('returns 404 for missing project', async () => {
      setFindById(null);
      const req = mockReq();
      const res = mockRes();
      await listTaskFields(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── Create ──
  describe('createTaskField', () => {
    it('creates a text field', async () => {
      const proj = buildProject([]);
      setFindById(proj);
      const req = mockReq({ body: { id: 'model', name: 'Model', type: 'text' } });
      const res = mockRes();
      await createTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockSave).toHaveBeenCalled();
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.data.field.id).toBe('model');
      expect(json.data.field.type).toBe('text');
      expect(json.data.field.position).toBe(1);
    });

    it('rejects duplicate field id', async () => {
      const proj = buildProject([{ id: 'model', name: 'Model', type: 'text', position: 0 }]);
      setFindById(proj);
      const req = mockReq({ body: { id: 'model', name: 'Model v2', type: 'text' } });
      const res = mockRes();
      await createTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.error).toContain('already exists');
    });

    it('rejects invalid type', async () => {
      const proj = buildProject([]);
      setFindById(proj);
      const req = mockReq({ body: { id: 'x', name: 'X', type: 'color' } });
      const res = mockRes();
      await createTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.error).toContain('Invalid type');
    });

    it('rejects select without options', async () => {
      const proj = buildProject([]);
      setFindById(proj);
      const req = mockReq({ body: { id: 'env', name: 'Env', type: 'select' } });
      const res = mockRes();
      await createTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.error).toContain('option');
    });

    it('creates select field with options', async () => {
      const proj = buildProject([]);
      setFindById(proj);
      const req = mockReq({ body: { id: 'env', name: 'Env', type: 'select', options: ['dev', 'prod'] } });
      const res = mockRes();
      await createTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.data.field.options).toEqual(['dev', 'prod']);
    });

    it('rejects missing required fields (id/name/type)', async () => {
      const proj = buildProject([]);
      setFindById(proj);
      const req = mockReq({ body: { id: 'x' } }); // missing name and type
      const res = mockRes();
      await createTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── Update ──
  describe('updateTaskField', () => {
    it('updates field name and required flag', async () => {
      const proj = buildProject([{ id: 'model', name: 'Model', type: 'text', position: 0, required: false }]);
      setFindById(proj);
      const req = mockReq({
        params: { projectId: '507f1f77bcf86cd799439011', fieldId: 'model' },
        body: { name: 'Device Model', required: true },
      });
      const res = mockRes();
      await updateTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockSave).toHaveBeenCalled();
      expect(mockMarkModified).toHaveBeenCalledWith('taskFieldDefinitions');
      const updated = proj.taskFieldDefinitions[0] as Record<string, unknown>;
      expect(updated.name).toBe('Device Model');
      expect(updated.required).toBe(true);
    });

    it('returns 404 for non-existent field', async () => {
      const proj = buildProject([{ id: 'model', name: 'Model', type: 'text', position: 0 }]);
      setFindById(proj);
      const req = mockReq({
        params: { projectId: '507f1f77bcf86cd799439011', fieldId: 'nope' },
        body: { name: 'New' },
      });
      const res = mockRes();
      await updateTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('rejects update that makes select field have no options', async () => {
      const proj = buildProject([{ id: 'env', name: 'Env', type: 'select', options: ['dev'], position: 0 }]);
      setFindById(proj);
      const req = mockReq({
        params: { projectId: '507f1f77bcf86cd799439011', fieldId: 'env' },
        body: { options: [] },
      });
      const res = mockRes();
      await updateTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.error).toContain('option');
    });
  });

  // ── Archive ──
  describe('archiveTaskField', () => {
    it('archives a field (soft delete)', async () => {
      const proj = buildProject([{ id: 'model', name: 'Model', type: 'text', position: 0, archived: false }]);
      setFindById(proj);
      const req = mockReq({
        params: { projectId: '507f1f77bcf86cd799439011', fieldId: 'model' },
      });
      const res = mockRes();
      await archiveTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockSave).toHaveBeenCalled();
      expect((proj.taskFieldDefinitions[0] as Record<string, unknown>).archived).toBe(true);
    });

    it('returns 404 for non-existent field', async () => {
      const proj = buildProject([]);
      setFindById(proj);
      const req = mockReq({
        params: { projectId: '507f1f77bcf86cd799439011', fieldId: 'nope' },
      });
      const res = mockRes();
      await archiveTaskField(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── Reorder ──
  describe('reorderTaskFields', () => {
    it('reorders fields by position', async () => {
      const proj = buildProject([
        { id: 'a', name: 'A', type: 'text', position: 0 },
        { id: 'b', name: 'B', type: 'text', position: 1 },
        { id: 'c', name: 'C', type: 'text', position: 2 },
      ]);
      setFindById(proj);
      const req = mockReq({ body: { fieldIds: ['c', 'a', 'b'] } });
      const res = mockRes();
      await reorderTaskFields(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockSave).toHaveBeenCalled();
      const defs = proj.taskFieldDefinitions as Record<string, unknown>[];
      expect(defs.find(d => d.id === 'c')!.position).toBe(0);
      expect(defs.find(d => d.id === 'a')!.position).toBe(1);
      expect(defs.find(d => d.id === 'b')!.position).toBe(2);
    });

    it('rejects non-array fieldIds', async () => {
      const proj = buildProject([]);
      setFindById(proj);
      const req = mockReq({ body: { fieldIds: 'not-array' } });
      const res = mockRes();
      await reorderTaskFields(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
