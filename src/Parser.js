/**
 * Parser - Receives any strategy and safely implement it
 *
 * @typedef {Base} - The Base class for any strategy
 * @param {Base} strategy - Any strategy implementing the Base's prototype
 */
function Parser (strategy) {
  this.strategy = strategy
}

/**
 * Parser.prototype.parse - Exposes the parsing from string to any valid JS type with the strategy
 *
 * @param {string} data
 * @param {object} options
 */
Parser.prototype.parse = function parse (data, options) {
  return this.strategy.parse(data, options)
}

/**
 * Parser.prototype.stringify - Exposes the stringify() method from any valid JS type to expected type with the strategy
 *
 * @param {*} data
 * @param {object} options
 */
Parser.prototype.stringify = function stringify (data, options) {
  return this.strategy.stringify(data, options)
}

Parser.prototype.get = function get (data, path) {}

Parser.prototype.has = function has (data, path) {}

module.exports = Parser
