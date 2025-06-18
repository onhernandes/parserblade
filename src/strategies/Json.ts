import { Transform } from "node:stream";
import * as JSONStream from "JSONStream";
import { ParserError } from "../errors";
import type { ParseOptions, StringifyOptions } from "../types";
import { Base } from "./Base";

/**
 * JSON parsing and stringifying options
 */
export interface JsonParseOptions extends ParseOptions {
  reviver?: (key: string, value: any) => any;
}

export interface JsonStringifyOptions extends StringifyOptions {
  replacer?: ((key: string, value: any) => any) | Array<number | string> | null;
  space?: string | number;
}

export interface JsonPipeParseOptions {
  path?: string;
}

export interface JsonPipeStringifyOptions {
  type?: "array" | "object";
}

/**
 * JSON strategy - Support for JSON file type
 */
export class Json extends Base {
  /**
   * Parse a JSON string and return valid JavaScript data
   */
  protected parseInternal(data: string, options?: JsonParseOptions): unknown {
    try {
      return JSON.parse(data, options?.reviver);
    } catch (error) {
      throw new ParserError("json", { originalError: error });
    }
  }

  /**
   * Stringify JavaScript data into JSON format
   */
  stringify(data: unknown, options?: JsonStringifyOptions): string {
    try {
      return JSON.stringify(data, options?.replacer as any, options?.space);
    } catch (error) {
      throw new ParserError("json", { originalError: error });
    }
  }

  /**
   * Create a transform stream for stringifying objects/arrays into JSON
   */
  pipeStringify(config: JsonPipeStringifyOptions = {}): Transform {
    const { type = "array" } = config;

    const streams = {
      object: JSONStream.stringifyObject,
      array: JSONStream.stringify,
    };

    const streamFunction = streams[type];

    if (!streamFunction) {
      throw new ParserError("json", {
        message: `Supplied type "${type}" is not allowed. Use either "array" or "object"`,
      });
    }

    // Create JSONStream and wrap it in a proper Transform
    const jsonStream = streamFunction();

    const transform = new Transform({
      objectMode: true,
      transform(
        chunk: any,
        _encoding: string,
        callback: (error?: Error, data?: any) => void
      ) {
        // Pass the chunk to JSONStream
        jsonStream.write(chunk);
        callback();
      },
      flush(callback: (error?: Error) => void) {
        // Signal end to JSONStream
        jsonStream.end();
        callback();
      },
    });

    // Forward JSONStream output to our Transform
    jsonStream.on("data", (data: any) => {
      transform.push(data);
    });

    jsonStream.on("end", () => {
      transform.push(null);
    });

    jsonStream.on("error", (error: Error) => {
      transform.emit("error", error);
    });

    transform.on("pipe", () => {
      // When something pipes to us, we're ready to start
    });

    return transform;
  }

  /**
   * Create a transform stream for parsing JSON data to JavaScript
   */
  pipeParse(config?: JsonPipeParseOptions): Transform {
    // Create JSONStream and wrap it in a proper Transform
    const jsonStream = JSONStream.parse(config?.path);

    const transform = new Transform({
      objectMode: true,
      transform(
        chunk: any,
        _encoding: string,
        callback: (error?: Error, data?: any) => void
      ) {
        // Pass the chunk to JSONStream
        jsonStream.write(chunk);
        callback();
      },
      flush(callback: (error?: Error) => void) {
        // Signal end to JSONStream
        jsonStream.end();
        callback();
      },
    });

    // Forward JSONStream output to our Transform
    jsonStream.on("data", (data: any) => {
      transform.push(data);
    });

    jsonStream.on("end", () => {
      transform.push(null);
    });

    jsonStream.on("error", (error: Error) => {
      transform.emit("error", error);
    });

    return transform;
  }
}
