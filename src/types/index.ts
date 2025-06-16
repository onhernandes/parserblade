import type { Transform } from "node:stream";

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
   * Create a transform stream for parsing
   */
  pipeParse(): Transform;

  /**
   * Create a transform stream for stringifying
   */
  pipeStringify(): Transform;
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
   * Create a transform stream for parsing
   */
  pipeParse(): Transform;

  /**
   * Create a transform stream for stringifying
   */
  pipeStringify(): Transform;
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
