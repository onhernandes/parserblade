const NotImplemented = require('../errors/NotImplemented')
const ParserError = require('../errors/ParserError')

/**
 * Base class for strategies around the Parser
 * Every function that haven't been implemented
 * will throw an NotImplementedError
 *
 * @constructor
 */
function Base () {
  this.a = true
}

/**
 * Base.prototype.stringify - receives * form of data and turns it into a string
 *
 * @param {*} data
 * @param {object} options
 * @throws {NotImplemented} This method must be implemented
 */
Base.prototype.stringify = function stringify (data, options) {
  throw new NotImplemented()
}

/**
 * Base.prototype.parse - receives an string and translate it to valid JavaScript
 *
 * @param {string} data
 * @param {object} options
 * @throws {NotImplemented} This method must be implemented
 */
Base.prototype.parse = function parse (data, options) {
  throw new NotImplemented()
}

/**
 * Base.prototype.pipe - prototype for streams
 *
 * @throws {NotImplemented} This method must be implemented
 */
Base.prototype.pipe = function pipe () {
  throw new NotImplemented()
}

/**
 * Base.prototype.valid - checks if a given value is valid in desired format using the implemented method parse(), ignoring any exception
 *
 * @param {object} options - any option accepted for the implemented method parse()
 * @returns {boolean} wether or not the given data is a valid format
 */
Base.prototype.valid = function valid (data, options = {}) {
  try {
    this.parse(data, options)
    return true
  } catch (error) {
    if (error instanceof ParserError) {
      return false
    }

    throw error
  }
}

module.exports = Base
