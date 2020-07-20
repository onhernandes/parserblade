const Base = require('./Base')
// const ParserError = require('../errors/ParserError')
const csvParser = require('csv-parse/lib/sync')
const csvStringify = require('csv-stringify/lib/sync')

/**
 * Csv - Support for CSV filetype
 */
function Csv () {}

Csv.prototype = Object.create(Base.prototype)

/**
 * Csv.prototype.parse - receives an CSV string and returns valid JS
 *
 * @param {string} data
 * @param {object} options
 * @param {boolean} options.headers - If should parse first line as the headers, default is true
 * @param {(string|Buffer)} options.delimiter - Which delimiters to use when parsing, defaults to comma `,`
 * @param {number} options.skipLines - How many lines it should skip before parsing, defaults to 1
 * @param {number} options.offset - How many lines it should parse, defaults to -1
 * @returns {array}
 */
Csv.prototype.parse = function parse (data, options = {}) {
  const config = {
    columns: true,
    skip_empty_lines: true,
    delimiter: options.delimiter || ',',
    from_line: options.skipLines || 1
  }

  if (options.headers === false) {
    config.columns = false
  }

  if (options.offset) {
    config.to_line = options.offset
  }

  return csvParser(data, config)
}

/**
 * Csv.prototype.stringify - receives * valid JS data and returns it as CSV
 *
 * @param {array} data
 * @param {object} options
 * @param {boolean} options.headers - If should set first line as the headers, default is true
 * @param {(array|object)} options.columns - Custom column mapping, see examples for more
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

module.exports = Csv
