import type { Transform } from "node:stream";
import type { ZodSchema } from "zod";
import type { ValidationAdapter } from './validation';

/**
 * Common parsing options that can be passed to any strategy
 */
export interface ParseOptions {
  [key: string]: unknown;
}

/**
 * Common stringify options that can be passed to any strategy
 */
export interface StringifyOptions {
  [key: string]: unknown;
}

/**
 * Validation options for Zod schema validation
 */
export interface ValidationOptions {
  /**
   * The validation adapter to use
   */
  adapter: ValidationAdapter;
  /**
   * Whether to throw an error on validation failure (default: true)
   */
  throwOnError?: boolean;
  /**
   * Custom error message for validation failures
   */
  errorMessage?: string;
}

/**
 * Result of schema validation
 */
export interface ValidationResult<T = unknown> {
  /**
   * Whether the validation was successful
   */
  success: boolean;
  /**
   * The validated data (if successful)
   */
  data?: T;
  /**
   * Validation error details (if failed)
   */
  error?: {
    message: string;
    issues: Array<{
      path: (string | number)[];
      message: string;
      code: string;
    }>;
  };
}

/**
 * CSV-specific parsing options
 */
export interface CsvParseOptions extends ParseOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  columns?: boolean | string[];
  skip_empty_lines?: boolean;
  skip_lines_with_error?: boolean;
}

/**
 * CSV-specific stringify options
 */
export interface CsvStringifyOptions extends StringifyOptions {
  delimiter?: string;
  quote?: string;
  quoted?: boolean;
  header?: boolean;
  columns?: string[];
}

/**
 * YAML-specific parsing options
 */
export interface YamlParseOptions extends ParseOptions {
  filename?: string;
  onWarning?: (warning: Error) => void;
  json?: boolean;
}

/**
 * YAML-specific stringify options
 */
export interface YamlStringifyOptions extends StringifyOptions {
  indent?: number;
  noArrayIndent?: boolean;
  skipInvalid?: boolean;
  flowLevel?: number;
  sortKeys?: boolean;
  lineWidth?: number;
  noRefs?: boolean;
  noCompatMode?: boolean;
  condenseFlow?: boolean;
}

/**
 * XML-specific parsing options
 */
export interface XmlParseOptions extends ParseOptions {
  compact?: boolean;
  ignoreDeclaration?: boolean;
  ignoreInstruction?: boolean;
  ignoreAttributes?: boolean;
  ignoreComment?: boolean;
  ignoreCdata?: boolean;
  ignoreDoctype?: boolean;
  ignoreText?: boolean;
}

/**
 * XML-specific stringify options
 */
export interface XmlStringifyOptions extends StringifyOptions {
  compact?: boolean;
  ignoreComment?: boolean;
  addParent?: boolean;
  textKey?: string;
  cdataKey?: string;
  commentKey?: string;
  attributesKey?: string;
  typeKey?: string;
  nameKey?: string;
  elementsKey?: string;
  parentKey?: string;
}

/**
 * Base strategy interface that all parsing strategies must implement
 */
export interface BaseStrategyProps {
  /**
   * Parse a string into a JavaScript value
   */
  parse(data: string, options?: ParseOptions): unknown;

  /**
   * Stringify a JavaScript value into a string
   */
  stringify(data: unknown, options?: StringifyOptions): string;

  /**
   * Check if a string is valid for this format
   */
  valid(data: string, options?: ParseOptions): boolean;

  /**
   * Validate parsed data against a Zod schema
   */
  validateSchema<T>(data: string, validationOptions: ValidationOptions): ValidationResult<T>;

  /**
   * Create a transform stream for parsing
   */
  pipeParse(): Transform;

  /**
   * Create a transform stream for stringifying
   */
  pipeStringify(): Transform;

  /**
   * Create a transform stream for validation with Zod schema
   */
  // biome-ignore lint/correctness/noUnusedVariables: Type parameter T is used for type inference in implementations
  pipeValidateSchema<T>(validationOptions: ValidationOptions): Transform;
}

/**
 * Parser interface
 */
export interface BaseParserProps {
  /**
   * Parse a string using the configured strategy
   */
  parse(data: string, options?: ParseOptions): unknown;

  /**
   * Stringify data using the configured strategy
   */
  stringify(data: unknown, options?: StringifyOptions): string;

  /**
   * Check if data is valid using the configured strategy
   */
  valid(data: string, options?: ParseOptions): boolean;

  /**
   * Validate parsed data against a Zod schema using the configured strategy
   */
  validateSchema<T>(data: string, validationOptions: ValidationOptions): ValidationResult<T>;

  /**
   * Create a transform stream for parsing
   */
  pipeParse(): Transform;

  /**
   * Create a transform stream for stringifying
   */
  pipeStringify(): Transform;

  /**
   * Create a transform stream for validation with Zod schema
   */
  // biome-ignore lint/correctness/noUnusedVariables: Type parameter T is used for type inference in implementations
  pipeValidateSchema<T>(validationOptions: ValidationOptions): Transform;
}

/**
 * Data types that can be parsed/stringified
 */
export type ParseableData = string | number | boolean | null | undefined | object | unknown[];

/**
 * Supported data formats
 */
export type DataFormat = "json" | "xml" | "csv" | "yaml";

/**
 * Parser instances for each supported format
 */
export interface ParserInstances {
  json: BaseParserProps;
  xml: BaseParserProps;
  csv: BaseParserProps;
  yaml: BaseParserProps;
}
