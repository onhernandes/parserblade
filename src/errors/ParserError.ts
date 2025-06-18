/**
 * ParserError - Custom error for parsing failures
 */
export class ParserError extends Error {
  public readonly context: Record<string, unknown>;

  constructor(format: string, context: Record<string, unknown> = {}) {
    const message = (context.message as string) || `Failed to parse ${format}`;
    super(message);
    this.name = "ParserError";
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParserError);
    }
  }
}
