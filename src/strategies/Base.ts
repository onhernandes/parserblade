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
    const { adapter, throwOnError = true, errorMessage } = validationOptions;

    try {
      // Parse the data first using the strategy
      const parsedData = this.parse(data);

      // Validate using the provided adapter
      const result = adapter.validate(parsedData);

      if (result.success) {
        return {
          success: true,
          data: result.data as T,
        };
      }

      if (!result.error) {
        throw new Error("Validation failed but no error details provided");
      }

      const error = {
        message: errorMessage || result.error.message,
        issues: result.error.issues,
      };

      if (throwOnError) {
        throw new ParserError("validation", { validationError: error });
      }

      return {
        success: false,
        error,
      };
    } catch (error) {
      if (error instanceof ParserError) {
        throw error;
      }

      const validationError = {
        message: errorMessage || "Validation error occurred",
        issues: [{ path: [], message: String(error), code: "unknown" }],
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
          const result = baseInstance.validateSchema<T>(dataString as string, validationOptions);

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
