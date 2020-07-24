const Base = require('./Base')
const ParserError = require('../errors/ParserError')
const yaml = require('js-yaml')

/**
 * Yaml - Support for YAML filetype
 *
 * @constructor
 */
function Yaml () {
}

Yaml.prototype = Object.create(Base.prototype)

/**
 * Yaml.prototype.stringify - receives * valid JS data and returns it as YAML
 *
 * @param {object} data
 * @param {Object} options - options for turning JS data into YAML
 * @throws {ParserError} For invalid data type
 * @returns {string}
 */
Yaml.prototype.stringify = function stringify (data, options = {}) {
  if (Array.isArray(data)) {
    throw new ParserError('Only plain objects are accepted for stringify()')
  }

  return yaml.safeDump(data)
}

/**
 * Yaml.prototype.parse - receives an YAML string and translate it to valid JavaScript
 *
 * @param {string} data
 * @param {object} options
 * @returns {object} Parsed YAML data as JS object
 */
Yaml.prototype.parse = function parse (data, options = {}) {
  return yaml.safeLoad(data)
}

module.exports = Yaml
