const Base = require('../Base')
const ParserError = require('../../errors/ParserError')
const xml = require('xml-js')

/**
 * Xml - Support for XML filetype
 *
 * @constructor
 */
function Xml () {
  this.XML_VERSION_TAG = {
    _declaration: {
      _attributes: {
        version: '1.0',
        encoding: 'utf-8'
      }
    }
  }
}

Xml.prototype = Object.create(Base.prototype)

/**
 * Xml.prototype.setXmlDeclaration - sets XML declaration tag on first position of array or object
 *
 * @param {(object|array)} data - input data
 * @returns {(object|array)}
 */
Xml.prototype.setXmlDeclaration = function setXmlDeclaration (data) {
  if (Array.isArray(data)) {
    data = [this.XML_VERSION_TAG, ...data]
  } else {
    data = { ...this.XML_VERSION_TAG, ...data }
  }

  return data
}

/**
 * Xml.prototype.stringify - receives * valid JS data and returns it as XML
 *
 * @param {(object|array)} data
 * @param {Object} options - options for turning JS data into XML
 * @param {boolean} options.ignoreDeclaration - don't output XML version tag, default is true
 * @example
 * // returns '<?xml version="1.0" encoding="utf-8"?><package>parser</package>'
 * const data = { package: 'parser' }
 * Xml().stringify(data)
 * @example
 * // returns '<package>parser</package>'
 * const data = { package: 'parser' }
 * Xml().stringify(data, { ignoreDeclaration: true })
 * @returns {string}
 */
Xml.prototype.stringify = function stringify (data, options = {}) {
  const config = {
    compact: true,
    ignoreDeclaration: false
  }

  data = this.setXmlDeclaration(data)

  if (options.ignoreDeclaration) {
    config.ignoreDeclaration = true
  }

  return xml.js2xml(data, config)
}

/**
 * Xml.prototype.parse - receives an XML string and translate it to valid JavaScript
 *
 * @param {string} data
 * @param {object} options
 * @param {object} options.showDeclaration - force parsing XML declaration tag
 * @param {boolean} options.verbose - makes xml2js return non compact mode, defaults to false
 * @throws {NotImplemented} This method must be implemented
 */
Xml.prototype.parse = function parse (data, options = {}) {
  try {
    const config = {
      compact: true,
      ignoreDeclaration: true,
      nativeType: true,
      nativeTypeAttributes: true
    }

    if (options.showDeclaration) {
      config.ignoreDeclaration = false
    }

    if (options.verbose) {
      config.compact = false
    }

    return xml.xml2js(data, config)
  } catch (error) {
    throw new ParserError(error.message)
  }
}

module.exports = Xml
