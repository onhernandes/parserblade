const Base = require('./Base')
const ParserError = require('../errors/ParserError')

/**
 * Json - Support for JSON filetype
 */
function Json () {}

Json.prototype = Object.create(Base.prototype)

/**
 * Json.prototype.parse - receives an JSON string and returns valid JS
 *
 * @param {string} data
 * @throws {ParserError} In case the JSON string is not valid, ParserError will be thrown
 * @returns {*}
 */
Json.prototype.parse = function parse (data) {
  try {
    return JSON.parse(data)
  } catch (e) {
    throw new ParserError('json')
  }
}

/**
 * Json.prototype.stringify - receives * valid JS data and returns it as JSON
 *
 * @param {*} data
 * @returns {string}
 */
Json.prototype.stringify = function parse (data) {
  return JSON.stringify(data)
}

module.exports = Json
