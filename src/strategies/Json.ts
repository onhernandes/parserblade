import type { Transform } from 'stream';
import * as JSONStream from 'JSONStream';
import { ParserError } from '../errors';
import type { ParseOptions, StringifyOptions } from '../types';
import { Base } from './Base';

/**
 * JSON parsing and stringifying options
 */
export interface JsonParseOptions extends ParseOptions {
  // JSON.parse doesn't have many options, but we can extend this
}

export interface JsonStringifyOptions extends StringifyOptions {
  replacer?: ((key: string, value: any) => any) | Array<number | string> | null;
  space?: string | number;
}

export interface JsonPipeParseOptions {
  path?: string;
}

export interface JsonPipeStringifyOptions {
  type?: 'array' | 'object';
}

/**
 * JSON strategy - Support for JSON file type
 */
export class Json extends Base {
  /**
   * Parse a JSON string and return valid JavaScript data
   */
  parse(data: string, options?: JsonParseOptions): unknown {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new ParserError('json', { originalError: error });
    }
  }

  /**
   * Stringify JavaScript data into JSON format
   */
  stringify(data: unknown, options?: JsonStringifyOptions): string {
    try {
      return JSON.stringify(data, options?.replacer as any, options?.space);
    } catch (error) {
      throw new ParserError('json', { originalError: error });
    }
  }

  /**
   * Create a transform stream for stringifying objects/arrays into JSON
   */
  pipeStringify(config: JsonPipeStringifyOptions = {}): Transform {
    const { type = 'array' } = config;

    const streams = {
      object: JSONStream.stringifyObject,
      array: JSONStream.stringify,
    };

    const streamFunction = streams[type];

    if (!streamFunction) {
      throw new ParserError('json', {
        message: `Supplied type "${type}" is not allowed. Use either "array" or "object"`,
      });
    }

    return streamFunction();
  }

  /**
   * Create a transform stream for parsing JSON data to JavaScript
   */
  pipeParse(config?: JsonPipeParseOptions): Transform {
    return JSONStream.parse(config?.path);
  }
}
