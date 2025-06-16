/**
 * NotImplementedError - Error thrown when a method hasn't been implemented
 */
export class NotImplementedError extends Error {
  constructor(message = "This method hasn't been implemented yet") {
    super(message);
    this.name = 'NotImplementedError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotImplementedError);
    }
  }
}
