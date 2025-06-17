import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidationAdapter, ValidationResult } from '../../types/validation';

export class JsonSchemaAdapter implements ValidationAdapter {
  private ajv: InstanceType<typeof Ajv>;

  constructor(private schema: object) {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv); // Add support for formats like email, uri, etc.
  }

  validate<T>(data: unknown): ValidationResult<T> {
    const validate = this.ajv.compile(this.schema);
    const valid = validate(data);

    if (valid) {
      return {
        success: true,
        data: data as T,
      };
    }

    return {
      success: false,
      error: {
        message: "Schema validation failed",
        issues: (validate.errors || []).map((error) => ({
          path: error.schemaPath.split('/').filter(Boolean),
          message: error.message || 'Invalid value',
          code: error.keyword,
        })),
      },
    };
  }
} 