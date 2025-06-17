import { Transform } from "node:stream";
import { ZodError } from "zod";
import { NotImplementedError, ParserError } from "../errors";
import type {
  BaseStrategyProps,
  ParseOptions,
  StringifyOptions,
  ValidationOptions,
  ValidationResult,
} from "../types";

/**
 * Base class for all parsing strategies
 * Every method that hasn't been implemented will throw a NotImplementedError
 */
export abstract class Base implements BaseStrategyProps {
  /**
   * Parse a string into a JavaScript value
   */
  parse(_data: string, _options?: ParseOptions): unknown {
    throw new NotImplementedError("parse method must be implemented");
  }

  /**
   * Stringify a JavaScript value into a string
   */
  stringify(_data: unknown, _options?: StringifyOptions): string {
    throw new NotImplementedError("stringify method must be implemented");
  }

  /**
   * Create a transform stream for parsing
   */
  pipeParse(_options?: any): Transform {
    throw new NotImplementedError("pipeParse method must be implemented");
  }

  /**
   * Create a transform stream for stringifying
   */
  pipeStringify(_options?: any): Transform {
    throw new NotImplementedError("pipeStringify method must be implemented");
  }

  /**
   * Check if a string is valid for this format
   * Uses the parse method and catches errors to determine validity
   */
  valid(data: string, options: ParseOptions = {}): boolean {
    try {
      this.parse(data, options);
      return true;
    } catch (error) {
      if (error instanceof ParserError) {
        return false;
      }
      // Re-throw other errors that aren't parsing-related
      throw error;
    }
  }

  /**
   * Validate parsed data against a Zod schema
   * First parses the data using the strategy, then validates against the schema
   */
  validateSchema<T>(data: string, validationOptions: ValidationOptions): ValidationResult<T> {
    const { schema, throwOnError = true, errorMessage } = validationOptions;

    try {
      // Parse the data first using the strategy
      const parsedData = this.parse(data);

      // Validate against the schema
      const result = schema.safeParse(parsedData);

      if (result.success) {
        return {
          success: true,
          data: result.data as T,
        };
      } else {
        const error = {
          message: errorMessage || "Schema validation failed",
          issues: result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
            code: issue.code,
          })),
        };

        if (throwOnError) {
          throw new ParserError("validation", { validationError: error });
        }

        return {
          success: false,
          error,
        };
      }
    } catch (error) {
      if (error instanceof ParserError) {
        // Re-throw parser errors as-is
        throw error;
      }

      // Handle other errors (including Zod errors)
      const validationError = {
        message: errorMessage || "Validation error occurred",
        issues:
          error instanceof ZodError
            ? error.issues.map((issue) => ({
                path: issue.path,
                message: issue.message,
                code: issue.code,
              }))
            : [{ path: [], message: String(error), code: "unknown" }],
      };

      if (throwOnError) {
        throw new ParserError("validation", { validationError });
      }

      return {
        success: false,
        error: validationError,
      };
    }
  }

  /**
   * Create a transform stream for validation with Zod schema
   * Parses data and validates it against the provided schema
   */
  pipeValidateSchema<T>(validationOptions: ValidationOptions): Transform {
    const baseInstance = this;

    return new Transform({
      objectMode: true,
      transform(
        chunk: Buffer | string,
        _encoding: string,
        callback: (error?: Error, data?: any) => void,
      ) {
        try {
          const dataString = chunk instanceof Buffer ? chunk.toString() : chunk;
          const result = baseInstance.validateSchema<T>(dataString, validationOptions);

          if (result.success) {
            this.push(result.data);
            callback();
          } else {
            // If throwOnError is false, push the error result
            if (validationOptions.throwOnError === false) {
              this.push(result);
              callback();
            } else {
              callback(new ParserError("validation", { validationError: result.error }));
            }
          }
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }
}
