import { Response } from 'express';
import {
  AppError,
  sendSuccess,
  sendError,
  handleNotFound,
  handleValidationError,
  handleUnauthorized,
  handleForbidden,
  handleConflict,
  handleServerError,
} from '../errorHandler';
import ApiResponse from '../ApiResponse';

describe('Error Handler Utilities', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };

      sendSuccess(mockRes as Response, 200, 'Operation successful', data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should send success response with 201 status', () => {
      sendSuccess(mockRes as Response, 201, 'Created', { id: 1 });

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should send success response with null data', () => {
      sendSuccess(mockRes as Response, 204, 'Deleted successfully');

      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  describe('sendError', () => {
    it('should send error response with status and message', () => {
      sendError(mockRes as Response, 400, 'Bad request');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should send error response with validation errors', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];

      sendError(mockRes as Response, 400, 'Validation failed', errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should send 401 unauthorized response', () => {
      sendError(mockRes as Response, 401, 'Unauthorized');

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should send 500 server error response', () => {
      sendError(mockRes as Response, 500, 'Internal server error');

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('handleValidationError', () => {
    it('should send validation error response', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' },
      ];

      handleValidationError(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('handleNotFound', () => {
    it('should send 404 not found response', () => {
      handleNotFound(mockRes as Response, 'User');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should include resource name in message', () => {
      handleNotFound(mockRes as Response, 'Project');

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('handleUnauthorized', () => {
    it('should send 401 unauthorized response', () => {
      handleUnauthorized(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('handleForbidden', () => {
    it('should send 403 forbidden response', () => {
      handleForbidden(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('handleConflict', () => {
    it('should send 409 conflict response', () => {
      handleConflict(mockRes as Response, 'Email already exists');

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('handleServerError', () => {
    it('should send 500 server error response', () => {
      const error = new Error('Database connection failed');

      handleServerError(mockRes as Response, error);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});

describe('AppError', () => {
  it('should create error with status code and message', () => {
    const error = new AppError(400, 'Bad request');

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
  });

  it('should create error with validation errors', () => {
    const errors = [{ field: 'email', message: 'Invalid email' }];
    const error = new AppError(400, 'Validation failed', errors);

    expect(error.statusCode).toBe(400);
    expect(error.errors).toEqual(errors);
  });

  it('should be instanceof Error', () => {
    const error = new AppError(500, 'Server error');

    expect(error instanceof Error).toBe(true);
  });

  it('should have correct prototype chain', () => {
    const error = new AppError(400, 'Test');

    expect(error instanceof AppError).toBe(true);
  });
});

describe('ApiResponse', () => {
  it('should create success response', () => {
    const response = new ApiResponse(200, 'Success', { id: 1 });

    expect(response.statusCode).toBe(200);
    expect(response.success).toBe(true);
    expect(response.message).toBe('Success');
    expect(response.data).toEqual({ id: 1 });
  });

  it('should create error response', () => {
    const response = new ApiResponse(400, 'Bad request');

    expect(response.statusCode).toBe(400);
    expect(response.success).toBe(false);
  });

  it('should include errors in response', () => {
    const errors = [{ field: 'email', message: 'Invalid' }];
    const response = new ApiResponse(400, 'Validation failed', null, errors);

    expect(response.errors).toEqual(errors);
  });

  it('should convert to JSON correctly', () => {
    const response = new ApiResponse(200, 'Success', { id: 1 });
    const json = response.toJSON();

    expect(json.success).toBe(true);
    expect(json.statusCode).toBe(200);
    expect(json.message).toBe('Success');
    expect(json.data).toEqual({ id: 1 });
  });

  it('should not include null data in JSON', () => {
    const response = new ApiResponse(204, 'Deleted');
    const json = response.toJSON();

    expect(json.data).toBeUndefined();
  });

  it('should not include empty errors in JSON', () => {
    const response = new ApiResponse(200, 'Success', { id: 1 });
    const json = response.toJSON();

    expect(json.errors).toBeUndefined();
  });
});
