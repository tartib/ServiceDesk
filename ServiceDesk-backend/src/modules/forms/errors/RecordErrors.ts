/**
 * RecordErrors — Custom error classes for the record flow.
 */

export class RecordNotFoundError extends Error {
  public code = 'RECORD_NOT_FOUND';
  public statusCode = 404;

  constructor(recordId: string) {
    super(`Record not found: ${recordId}`);
    this.name = 'RecordNotFoundError';
  }
}

export class RecordValidationError extends Error {
  public code = 'RECORD_VALIDATION_ERROR';
  public statusCode = 400;
  public fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'RecordValidationError';
    this.fields = fields;
  }
}

export class RecordPermissionError extends Error {
  public code = 'RECORD_PERMISSION_DENIED';
  public statusCode = 403;

  constructor(action: string, recordId?: string) {
    super(`Permission denied: cannot ${action}${recordId ? ` on record ${recordId}` : ''}`);
    this.name = 'RecordPermissionError';
  }
}

export class RecordStateError extends Error {
  public code = 'RECORD_INVALID_STATE';
  public statusCode = 409;

  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} a record in status "${currentStatus}"`);
    this.name = 'RecordStateError';
  }
}

export class RequestTypeNotFoundError extends Error {
  public code = 'REQUEST_TYPE_NOT_FOUND';
  public statusCode = 404;

  constructor(id: string) {
    super(`Request type not found: ${id}`);
    this.name = 'RequestTypeNotFoundError';
  }
}

export class DraftNotOwnedError extends Error {
  public code = 'DRAFT_NOT_OWNED';
  public statusCode = 403;

  constructor() {
    super('Draft does not belong to the current user');
    this.name = 'DraftNotOwnedError';
  }
}

/**
 * Type guard for custom record errors.
 */
export function isRecordError(
  err: unknown,
): err is { code: string; statusCode: number; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'statusCode' in err
  );
}
