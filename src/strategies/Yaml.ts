import { Transform } from "node:stream";
import * as yaml from "js-yaml";
import { ParserError } from "../errors";
import type { YamlParseOptions, YamlStringifyOptions } from "../types";
import { Base } from "./Base";

/**
 * YAML strategy - Support for YAML file type
 */
export class Yaml extends Base {
  /**
   * Parse a YAML string and return valid JavaScript data
   */
  parse(data: string, options: YamlParseOptions = {}): unknown {
    try {
      return yaml.load(data, options);
    } catch (error: any) {
      const context = {
        errorName: error.name,
        message: error.message,
        mark: error.mark,
      };

      throw new ParserError("yaml", context);
    }
  }

  /**
   * Stringify JavaScript data into YAML format
   * Note: Only plain objects are accepted, arrays are not supported
   */
  stringify(data: unknown, options: YamlStringifyOptions = {}): string {
    if (Array.isArray(data)) {
      throw new ParserError("yaml", {
        message: "Only plain objects are accepted for stringify()",
      });
    }

    try {
      return yaml.dump(data, options);
    } catch (error) {
      throw new ParserError("yaml", { originalError: error });
    }
  }

  /**
   * Check if a string is valid YAML
   */
  valid(data: string): boolean {
    try {
      yaml.load(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a transform stream for parsing YAML data
   * Note: YAML doesn't have native streaming support like JSON/CSV
   */
  pipeParse(): Transform {
    const yamlInstance = this;
    return new Transform({
      objectMode: true,
      transform(chunk: Buffer, _encoding: string, callback: (error?: Error) => void) {
        try {
          const result = yamlInstance.parse(chunk.toString());
          this.push(result);
          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  /**
   * Create a transform stream for stringifying data to YAML
   * Note: YAML doesn't have native streaming support like JSON/CSV
   */
  pipeStringify(): Transform {
    const yamlInstance = this;
    return new Transform({
      objectMode: true,
      transform(chunk: unknown, _encoding: string, callback: (error?: Error) => void) {
        try {
          const result = yamlInstance.stringify(chunk);
          this.push(result);
          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }
}
