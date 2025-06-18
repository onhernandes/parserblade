import type { Transform } from "node:stream";
import type { Parser } from "./Parser";
import { ParserError } from "./errors";
import { type Base, Csv, Json, Xml, Yaml } from "./strategies";
import type { CsvParseOptionsExtended, CsvStringifyOptionsExtended } from "./strategies/Csv";
import type {
  JsonParseOptions,
  JsonPipeParseOptions,
  JsonPipeStringifyOptions,
  JsonStringifyOptions,
} from "./strategies/Json";
import type {
  XmlParseOptionsExtended,
  XmlPipeParseOptions,
  XmlPipeStringifyOptions,
} from "./strategies/Xml";
import type {
  CsvParseOptions,
  CsvStringifyOptions,
  DataFormat,
  XmlParseOptions,
  XmlStringifyOptions,
  YamlParseOptions,
  YamlStringifyOptions,
} from "./types";

export type ParseOptions =
  | { fileType: "json"; options?: JsonParseOptions }
  | { fileType: "csv"; options?: CsvParseOptionsExtended }
  | { fileType: "xml"; options?: XmlParseOptionsExtended }
  | { fileType: "yaml"; options?: YamlParseOptions };

export type StringifyOptions =
  | { fileType: "json"; options?: JsonStringifyOptions }
  | { fileType: "csv"; options?: CsvStringifyOptionsExtended }
  | { fileType: "xml"; options?: XmlStringifyOptions }
  | { fileType: "yaml"; options?: YamlStringifyOptions };

export type PipeParseOptions =
  | { fileType: "json"; options?: JsonPipeParseOptions }
  | { fileType: "csv"; options?: CsvParseOptionsExtended }
  | { fileType: "xml"; options?: XmlPipeParseOptions }
  | { fileType: "yaml"; options?: never };

export type PipeStringifyOptions =
  | { fileType: "json"; options?: JsonPipeStringifyOptions }
  | { fileType: "csv"; options?: CsvStringifyOptionsExtended }
  | { fileType: "xml"; options?: XmlPipeStringifyOptions }
  | { fileType: "yaml"; options?: never };

/**
 * ParserBlade - A unified interface for parsing multiple file formats
 * Provides type-safe options for each supported format
 */
export class ParserBlade {
  public readonly strategies: Record<DataFormat, Base>;

  constructor() {
    this.strategies = {
      json: new Json(),
      csv: new Csv(),
      xml: new Xml(),
      yaml: new Yaml(),
    };
  }

  /**
   * Parse a string using the specified file type and its specific options
   */
  parse(config: ParseOptions, data: string): unknown {
    const strategy = this.strategies[config.fileType];
    if (!strategy) {
      throw new ParserError(config.fileType, {
        message: `Unsupported file type: ${config.fileType}`,
      });
    }

    return strategy.parse(data, config.options);
  }

  /**
   * Stringify data using the specified file type and its specific options
   */
  stringify(config: StringifyOptions, data: unknown): string {
    const strategy = this.strategies[config.fileType];
    if (!strategy) {
      throw new ParserError(config.fileType, {
        message: `Unsupported file type: ${config.fileType}`,
      });
    }

    return strategy.stringify(data, config.options);
  }

  /**
   * Check if data is valid for the specified file type
   */
  valid(config: ParseOptions, data: string): boolean {
    const strategy = this.strategies[config.fileType];
    if (!strategy) {
      return false;
    }

    return strategy.valid(data, config.options);
  }

  /**
   * Create a transform stream for parsing using the specified file type
   */
  pipeParse(config: PipeParseOptions): Transform {
    const strategy = this.strategies[config.fileType];
    if (!strategy) {
      throw new ParserError(config.fileType, {
        message: `Unsupported file type: ${config.fileType}`,
      });
    }

    if (config.fileType === "yaml") {
      return strategy.pipeParse();
    }

    return strategy.pipeParse(config.options);
  }

  /**
   * Create a transform stream for stringifying using the specified file type
   */
  pipeStringify(config: PipeStringifyOptions): Transform {
    const strategy = this.strategies[config.fileType];
    if (!strategy) {
      throw new ParserError(config.fileType, {
        message: `Unsupported file type: ${config.fileType}`,
      });
    }

    if (config.fileType === "yaml") {
      return strategy.pipeStringify();
    }

    return strategy.pipeStringify(config.options);
  }
}
