import type { Transform } from "node:stream";
import { NotImplementedError, ParserError } from "../errors";
import type { BaseStrategyProps, ParseOptions, StringifyOptions } from "../types";

/**
 * Base class for all parsing strategies
 * Every method that hasn't been implemented will throw a NotImplementedError
 */
export abstract class Base implements BaseStrategyProps {
  /**
   * Parse a string into a JavaScript value
   * Must be implemented by subclasses
   */
  parse(_data: string, _options?: ParseOptions): unknown {
    throw new NotImplementedError("parse method must be implemented");
  }

  /**
   * Stringify a JavaScript value into a string
   * Must be implemented by subclasses
   */
  stringify(_data: unknown, _options?: StringifyOptions): string {
    throw new NotImplementedError("stringify method must be implemented");
  }

  /**
   * Create a transform stream for parsing
   * Must be implemented by subclasses
   */
  pipeParse(): Transform {
    throw new NotImplementedError("pipeParse method must be implemented");
  }

  /**
   * Create a transform stream for stringifying
   * Must be implemented by subclasses
   */
  pipeStringify(): Transform {
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
}
