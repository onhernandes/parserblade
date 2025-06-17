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
}
