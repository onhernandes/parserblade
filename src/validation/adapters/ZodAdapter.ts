import type { z } from 'zod';
import type { ValidationAdapter, ValidationResult } from '../../types/validation';

export class ZodAdapter implements ValidationAdapter {
  constructor(private schema: z.ZodType) {}

  validate<T>(data: unknown): ValidationResult<T> {
    const result = this.schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data as T,
      };
    }

    return {
      success: false,
      error: {
        message: "Schema validation failed",
        issues: result.error.issues.map(issue => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        })),
      },
    };
  }
} 