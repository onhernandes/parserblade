import type Joi from 'joi';
import type { ValidationAdapter, ValidationResult } from '../../types/validation';

export class JoiAdapter implements ValidationAdapter {
  constructor(private schema: Joi.Schema) {}

  validate<T>(data: unknown): ValidationResult<T> {
    const result = this.schema.validate(data, { abortEarly: false });
    
    if (!result.error) {
      return {
        success: true,
        data: result.value as T,
      };
    }

    return {
      success: false,
      error: {
        message: "Schema validation failed",
        issues: result.error.details.map((detail: Joi.ValidationErrorItem) => ({
          path: detail.path,
          message: detail.message,
          code: detail.type,
        })),
      },
    };
  }
} 