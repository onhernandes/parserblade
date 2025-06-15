import { Transform } from 'stream';
import { IStrategy, IParser, ParseOptions, StringifyOptions } from './types';

/**
 * Parser - Receives any strategy and safely implements it
 * Provides a uniform interface for parsing different data formats
 */
export class Parser implements IParser {
  private readonly strategy: IStrategy;

  constructor(strategy: IStrategy) {
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

  // TODO: Implement get and has methods in v2
  // get(data: unknown, path: string): unknown {}
  // has(data: unknown, path: string): boolean {}
}
