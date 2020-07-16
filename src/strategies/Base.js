const NotImplemented = require('../errors/NotImplemented')

/**
 * Base class for strategies around the Parser
 * Every function that haven't been implemented
 * will throw an NotImplementedError
 *
 * @constructor
 */
function Base () {}

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

module.exports = Base
