export class ApiError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly details?: string | string[];

  constructor(status: number, message: string, error?: string, details?: string | string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error || 'ApiError';
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get statusCode(): number {
    return this.status;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isConflict(): boolean {
    return this.status === 409;
  }

  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  static fromResponse(status: number, data: any): ApiError {
    let message = 'An error occurred while contacting the server.';
    let error = 'UnknownError';
    let details: string | string[] | undefined;

    if (data && typeof data === 'object') {
      if (Array.isArray(data.message)) {
        message = data.message.join('; ');
        details = data.message;
      } else if (typeof data.message === 'string') {
        message = data.message;
      }
      if (typeof data.error === 'string') {
        error = data.error;
      }
    }

    return new ApiError(status, message, error, details);
  }

  static networkError(originalError?: Error): ApiError {
    return new ApiError(
      0,
      originalError?.message || 'Network failure. Please check your internet connection.',
      'NetworkError'
    );
  }

  static timeoutError(timeoutMs: number): ApiError {
    return new ApiError(
      408,
      `Request timed out after ${timeoutMs}ms. The server took too long to respond.`,
      'TimeoutError'
    );
  }
}
