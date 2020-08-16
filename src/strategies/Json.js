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
 * Json.prototype.pipeStringify - helps to stream object or array into JSON valid data
 *
 * @param {object} [config] - sets config for stream
 * @param {string} [config.type='array'] - which type of data you're streaming, defaults do array
 * @returns {WritableStream}
 */
Json.prototype.pipeStringify = function pipeStringify (config = {}) {
  config.type = config.type || 'array'
  const streams = {
    object: JSONStream.stringifyObject,
    array: JSONStream.stringify
  }

  const fn = streams[config.type]

  if (!fn) {
    throw new ParserError(`Supplied type "${config.type}" is not allowed. Use either "array" or "object"`)
  }

  return fn()
}

/**
 * Json.prototype.pipeStringify - helps to stream JSON data to JS
 *
 * @param {object} [config] - sets config for stream
 * @param {string} [config.path] - select which data path to be parsed from JSON to JS
 * @returns {Stream}
 */
Json.prototype.pipeParse = function pipeParse (config) {
  return JSONStream.parse()
}

module.exports = Json
