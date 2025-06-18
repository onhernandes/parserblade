import { Parser } from "./Parser";
import { Csv, Json, Xml, Yaml } from "./strategies";
import type { DataFormat } from "./types";

/**
 * Pre-configured parser instances for each supported format
 */
const parsers: Record<DataFormat, Parser> = {
  json: new Parser(new Json()),
  xml: new Parser(new Xml()),
  yaml: new Parser(new Yaml()),
  csv: new Parser(new Csv()),
};

// Export individual parsers for direct use
export const { json, xml, yaml, csv } = parsers;

// Export the Parser class and strategies for advanced usage
export { Parser } from "./Parser";
export { ParserBlade } from "./ParserBlade";
export type {
  ParseOptions,
  StringifyOptions,
  PipeParseOptions,
  PipeStringifyOptions,
} from "./ParserBlade";
export { Json, Xml, Yaml, Csv, Base } from "./strategies";
export { ParserError, NotImplementedError } from "./errors";

// Export type definitions
export * from "./types";

// Export hash utilities
export * from "./hash";

// Export compression utilities
export * from "./compression";

// Default export for convenience
export default parsers;
