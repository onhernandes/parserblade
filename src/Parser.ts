import type { Transform } from "node:stream";
import type {
  BaseParserProps,
  BaseStrategyProps,
  ParseOptions,
  StringifyOptions,
} from "./types";

/**
 * Parser - Receives any strategy and safely implements it
 * Provides a uniform interface for parsing different data formats
 */
export class Parser implements BaseParserProps {
  private readonly strategy: BaseStrategyProps;

  constructor(strategy: BaseStrategyProps) {
    this.strategy = strategy;
  }

  /**
   * Parse a string using the configured strategy
   */
  parse(data: string, options?: ParseOptions): unknown {
    return this.strategy.parse(data, options);
  }

  /**
   * Stringify data using the configured strategy
   */
  stringify(data: unknown, options?: StringifyOptions): string {
    return this.strategy.stringify(data, options);
  }

  /**
   * Check if data is valid using the configured strategy
   */
  valid(data: string, options?: ParseOptions): boolean {
    return this.strategy.valid(data, options);
  }

  /**
   * Create a transform stream for parsing
   */
  pipeParse(): Transform {
    return this.strategy.pipeParse();
  }

  /**
   * Create a transform stream for stringifying
   */
  pipeStringify(): Transform {
    return this.strategy.pipeStringify();
  }

  /**
   * Validate parsed data against a schema using the configured strategy
   */
  validateSchema<T>(
    data: string,
    validationOptions: import("./types").ValidationOptions
  ): import("./types").ValidationResult<T> {
    return this.strategy.validateSchema<T>(data, validationOptions);
  }

  /**
   * Parse a string with validation in a single operation
   */
  parseWithValidation<T>(
    data: string,
    options: import("./types").ParseOptions & {
      validation: NonNullable<import("./types").ParseOptions["validation"]>;
    }
  ): import("./types").ValidationResult<T> {
    return this.strategy.parseWithValidation<T>(data, options);
  }

  /**
   * Create a transform stream for validation with a schema using the configured strategy
   */
  pipeValidateSchema<T>(
    validationOptions: import("./types").ValidationOptions
  ): Transform {
    return this.strategy.pipeValidateSchema<T>(validationOptions);
  }

  // TODO: Implement get and has methods in v2
  // get(data: unknown, path: string): unknown {}
  // has(data: unknown, path: string): boolean {}
}
