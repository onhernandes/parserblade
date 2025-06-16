import { Transform } from "node:stream";
import * as xml from "xml-js";
import { NotImplementedError, ParserError } from "../errors";
import type { XmlParseOptions, XmlStringifyOptions } from "../types";
import { Base } from "./Base";

/**
 * Extended XML parsing options
 */
export interface XmlParseOptionsExtended extends XmlParseOptions {
  showDeclaration?: boolean;
  verbose?: boolean;
  experimentalXmlTag?: boolean;
}

/**
 * XML pipe parse options
 */
export interface XmlPipeParseOptions extends XmlParseOptionsExtended {
  depth?: number;
}

/**
 * XML pipe stringify options
 */
export interface XmlPipeStringifyOptions extends XmlStringifyOptions {
  mainTag?: {
    name?: string;
    text?: string;
  };
}

/**
 * XML strategy - Support for XML file type
 */
export class Xml extends Base {
  private readonly XML_VERSION_TAG = {
    _declaration: {
      _attributes: {
        version: "1.0",
        encoding: "utf-8",
      },
    },
  };

  /**
   * Set XML declaration tag on first position of array or object
   */
  private setXmlDeclaration(data: unknown): unknown {
    if (Array.isArray(data)) {
      return [this.XML_VERSION_TAG, ...data];
    }
    if (typeof data === "object" && data !== null) {
      return { ...this.XML_VERSION_TAG, ...data };
    }
    return data;
  }

  /**
   * Parse an XML string and return valid JavaScript data
   */
  parse(data: string, options: XmlParseOptionsExtended = {}): unknown {
    try {
      const config: any = {
        compact: true,
        ignoreDeclaration: true,
        nativeType: true,
        nativeTypeAttributes: true,
      };

      if (options.showDeclaration) {
        config.ignoreDeclaration = false;
      }

      if (options.verbose) {
        config.compact = false;
      }

      const result = xml.xml2js(data, config);

      if (options.experimentalXmlTag) {
        return this.toXmlTag(result);
      }

      return result;
    } catch (error: any) {
      throw new ParserError("xml", {
        originalError: error,
        message: error.message,
      });
    }
  }

  /**
   * Stringify JavaScript data into XML format
   */
  stringify(data: unknown, options: XmlStringifyOptions = {}): string {
    try {
      const config: any = {
        compact: true,
        ignoreDeclaration: false,
      };

      const processedData = this.setXmlDeclaration(data);

      if (options.ignoreDeclaration) {
        config.ignoreDeclaration = true;
      }

      return xml.js2xml(processedData as any, config);
    } catch (error) {
      throw new ParserError("xml", { originalError: error });
    }
  }

  /**
   * Turn xml2js non-compact result into XmlTag and XmlResult
   * TODO: Implement this experimental feature
   */
  private toXmlTag(_xml2jsResult: unknown): unknown {
    throw new NotImplementedError("toXmlTag method is not yet implemented");
  }

  /**
   * Create a transform stream for parsing XML data
   * TODO: Implement advanced streaming with proper TypeScript support
   */
  pipeParse(options: XmlPipeParseOptions = {}): Transform {
    const xmlInstance = this;
    return new Transform({
      objectMode: true,
      transform(chunk: Buffer, _encoding: string, callback: (error?: Error) => void) {
        try {
          const result = xmlInstance.parse(chunk.toString(), options);
          this.push(result);
          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  /**
   * Create a transform stream for stringifying data to XML
   * TODO: Implement advanced streaming with proper TypeScript support
   */
  pipeStringify(options: XmlPipeStringifyOptions = {}): Transform {
    const xmlInstance = this;
    return new Transform({
      objectMode: true,
      transform(chunk: unknown, _encoding: string, callback: (error?: Error) => void) {
        try {
          const result = xmlInstance.stringify(chunk, options);
          this.push(result);
          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }
}
