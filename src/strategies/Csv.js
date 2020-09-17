const Base = require('./Base')
const ParserError = require('../errors/ParserError')
const csvParser = require('csv-parse/lib/sync')
const csvStringify = require('csv-stringify/lib/sync')
const csvParserStream = require('csv-parse')
const csvStringifyStream = require('csv-stringify')

/**
 * Csv - Support for CSV filetype
 *
 * @constructor
 */
function Csv () {}

Csv.prototype = Object.create(Base.prototype)

/**
 * Csv.prototype.parse - receives an CSV string and returns valid JS
 *
 * @param {string} data
 * @param {object} [options]
 * @param {(boolean|array|function)} [options.headers] - If should parse first line as the headers, default is true
 * @param {(string|Buffer)} [options.delimiter] - Which delimiters to use when parsing, defaults to comma `,`
 * @param {number} [options.skipLines] - How many lines it should skip before parsing, defaults to 1
 * @param {number} [options.offset] - How many lines it should parse, defaults to -1
 * @returns {array}
 */
Csv.prototype.parse = function parse (data, options = {}) {
  const config = {
    columns: true,
    skip_empty_lines: true,
    delimiter: options.delimiter || ',',
    from_line: options.skipLines || 1
  }

  if (Object.prototype.hasOwnProperty.apply(options, ['headers'])) {
    config.columns = options.headers
  }

  if (options.offset) {
    config.to_line = options.offset
  }

  try {
    return csvParser(data, config)
  } catch (e) {
    const context = {
      code: e.code,
      message: e.message,
      column: e.column,
      emptyLines: e.empty_lines,
      header: e.header,
      index: e.index,
      lines: e.lines,
      quoting: e.quoting,
      records: e.records
    }

    throw new ParserError('csv', context)
  }
}

/**
 * Csv.prototype.stringify - receives * valid JS data and returns it as CSV
 *
 * @param {array} data
 * @param {object} [options]
 * @param {boolean} [options.headers] - If should set first line as the headers, default is true
 * @param {(array|object)} [options.columns] - Custom column mapping, see examples for more
 * @returns {string}
 */
Csv.prototype.stringify = function stringify (data, options = {}) {
  const config = {
    header: true
  }

  if (options.headers === false) {
    config.header = false
  }

  if (options.columns) {
    config.columns = options.columns
  }

  return csvStringify(data, config)
}

/**
 * Csv.prototype.pipeParse - allow streaming data
 *
 * @param {object} [options]
 * @param {(boolean|array|function)} [options.headers] - If should parse first line as the headers, default is true
 * @param {string} [options.delimiter] - Which delimiters to use when parsing, defaults to comma `,`
 */
Csv.prototype.pipeParse = function pipeParse (options = {}) {
  const config = {
    delimiter: options.delimiter || ',',
    columns: Reflect.has(options, 'headers') ? options.headers : true
  }

  return csvParserStream(config)
}

/**
 * Csv.prototype.pipeStringify - stream
 *
 * @param {array} data
 * @param {object} [options]
 * @param {boolean} [options.headers] - If should set first line as the headers, default is true
 * @param {string} [options.delimiter] - Which delimiters to use when parsing, defaults to comma `,`
 * @param {(array|object)} [options.columns] - Custom column mapping, see examples for more
 */
Csv.prototype.pipeStringify = function pipeStringify (options = {}) {
  const config = {
    delimiter: options.delimiter || ',',
    header: Reflect.has(options, 'headers') ? !!options.headers : true
  }

  if (Reflect.has(options, 'columns')) {
    config.columns = options.columns
  }

  return csvStringifyStream(config)
}

module.exports = Csv
