const Base = require('./Base')
const ParserError = require('../errors/ParserError')
const JSONStream = require('JSONStream')

/**
 * Json - Support for JSON filetype
 *
 * @constructor
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
Json.prototype.stringify = function stringify (data) {
  return JSON.stringify(data)
}

/**
 * Json.prototype.pipeStringify - receives * valid JS data and returns it as JSON
 *
 * @param {object} config
 * @returns {Stream}
 */
Json.prototype.pipeStringify = function pipeStringify (config) {
  return JSONStream.stringify()
}

/**
 * Json.prototype.pipeStringify - receives * valid JS data and returns it as JSON
 *
 * @param {object} config
 * @returns {Stream}
 */
Json.prototype.pipeParse = function pipeStringify (config) {
  return JSONStream.parse()
}

module.exports = Json
