import { Transform } from 'stream';
import { parse as csvParser } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { parse as csvParserStream } from 'csv-parse';
import { stringify as csvStringifyStream } from 'csv-stringify';
import { Base } from './Base';
import { ParserError } from '../errors';
import { CsvParseOptions, CsvStringifyOptions } from '../types';

/**
 * Extended CSV parsing options with additional fields
 */
export interface CsvParseOptionsExtended extends CsvParseOptions {
  headers?: boolean | string[];
  skipLines?: number;
  offset?: number;
}

/**
 * Extended CSV stringify options with additional fields
 */
export interface CsvStringifyOptionsExtended extends Omit<CsvStringifyOptions, 'columns'> {
  headers?: boolean;
  columns?: string[] | Record<string, string>;
}

/**
 * CSV strategy - Support for CSV file type
 */
export class Csv extends Base {
  /**
   * Parse a CSV string and return valid JavaScript array
   */
  parse(data: string, options: CsvParseOptionsExtended = {}): unknown[] {
    const config: any = {
      columns: true,
      skip_empty_lines: true,
      delimiter: options.delimiter || ',',
      from_line: options.skipLines || 1,
    };

    if (Object.prototype.hasOwnProperty.call(options, 'headers')) {
      config.columns = options.headers;
    }

    if (options.offset) {
      config.to_line = options.offset;
    }

    try {
      return csvParser(data, config);
    } catch (error: any) {
      const context = {
        code: error.code,
        message: error.message,
        column: error.column,
        emptyLines: error.empty_lines,
        header: error.header,
        index: error.index,
        lines: error.lines,
        quoting: error.quoting,
        records: error.records,
      };

      throw new ParserError('csv', context);
    }
  }

  /**
   * Stringify JavaScript data into CSV format
   */
  stringify(data: unknown[], options: CsvStringifyOptionsExtended = {}): string {
    const config: any = {
      header: true,
    };

    if (options.headers === false) {
      config.header = false;
    }

    if (options.columns) {
      config.columns = options.columns;
    }

    try {
      return csvStringify(data, config);
    } catch (error) {
      throw new ParserError('csv', { originalError: error });
    }
  }

  /**
   * Create a transform stream for parsing CSV data
   */
  pipeParse(options: CsvParseOptionsExtended = {}): Transform {
    const config: any = {
      delimiter: options.delimiter || ',',
      columns: Object.prototype.hasOwnProperty.call(options, 'headers') ? options.headers : true,
    };

    return csvParserStream(config);
  }

  /**
   * Create a transform stream for stringifying data to CSV
   */
  pipeStringify(options: CsvStringifyOptionsExtended = {}): Transform {
    const config: any = {
      delimiter: options.delimiter || ',',
      header: Object.prototype.hasOwnProperty.call(options, 'headers') ? !!options.headers : true,
    };

    if (Object.prototype.hasOwnProperty.call(options, 'columns')) {
      config.columns = options.columns;
    }

    return csvStringifyStream(config);
  }
}
