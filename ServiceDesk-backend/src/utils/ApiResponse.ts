export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: ApiErrorField[];
}

class ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiErrorField[];

  constructor(
    statusCode: number,
    message: string,
    data: T | null = null,
    errors: ApiErrorField[] = []
  ) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  toJSON(): ApiResponseBody<T> {
    const response: ApiResponseBody<T> = {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
    };

    if (this.data !== null && this.data !== undefined) {
      response.data = this.data;
    }

    if (this.errors.length > 0) {
      response.errors = this.errors;
    }

    return response;
  }
}

export default ApiResponse;
