class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, details?: Record<string, unknown> | boolean, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    
    // Handle overloaded parameters: if details is a boolean, it's the old isOperational param
    if (typeof details === 'boolean') {
      this.isOperational = details;
      this.details = undefined;
    } else {
      this.isOperational = isOperational;
      this.details = details;
    }

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
