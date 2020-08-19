const Base = require('../Base')
const ParserError = require('../../errors/ParserError')
const xml = require('xml-js')
const StreamParser = require('node-xml-stream')
const { Transform } = require('stream')

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

  this.XML_JS_KEYS = {
    declarationKey: '_declaration',
    instructionKey: '_instruction',
    attributesKey: '_attributes',
    textKey: '_text',
    cdataKey: '_cdata',
    doctypeKey: '_doctype',
    commentKey: '_comment',
    parentKey: '_parent',
    typeKey: '_type',
    nameKey: '_name',
    elementsKey: '_elements'
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
 * @param {boolean} options.experimentalXmlTag - use experimental XmlTag prototype, default is false
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

    const result = xml.xml2js(data, config)

    if (options.experimentalXmlTag) {
      return this.toXmlTag(result)
    }

    return result
  } catch (error) {
    throw new ParserError(error.message)
  }
}

/**
 * Xml.prototype.pipeParse - stream
 *
 * Using repl.it: https://repl.it/@onhernandes/AnnualEnormousRegisters
 */
Xml.prototype.pipeParse = function pipeParse () {
  const history = [] // eslint-disable-line
  const parser = new StreamParser()

  const currentTag = { // eslint-disable-line
    name: '',
    text: '',
    attributes: ''
  }

  parser.on('opentag', (name, attrs) => {
  })

  return new Transform({
    transform (chunk, encoding, ack) {
      parser.write(chunk.toString())
    }
  })
}

module.exports = Xml
