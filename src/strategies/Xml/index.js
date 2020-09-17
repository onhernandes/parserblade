const Base = require('../Base')
const ParserError = require('../../errors/ParserError')
const xml = require('xml-js')
const NotImplemented = require('../../errors/NotImplemented')
const { Transform } = require('stream')
const StreamParser = require('node-xml-stream')
const { XmlTag, XmlCharacterData, XmlDeclaration } = require('./XmlTag')

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
 * @param {Object} [options] - options for turning JS data into XML
 * @param {boolean} [options.ignoreDeclaration] - don't output XML version tag, default is true
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
 * @param {object} [options]
 * @param {boolean} [options.showDeclaration] - force parsing XML declaration tag
 * @param {boolean} [options.verbose] - makes xml2js return non compact mode, defaults to false
 * @param {boolean} [options.experimentalXmlTag] - use experimental XmlTag prototype, default is false
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
 * Xml.prototype.toXmlTag - turns xml2js non-compact result into XmlTag and XmlResult
 *
 * @param {object} xml2jsResult
 * @throws {NotImplemented}
 */
Xml.prototype.toXmlTag = function toXmlTag (xml2jsResult) {
  throw new NotImplemented()
}

/**
 * Xml.prototype.pipeParse - stream
 *
 * @param {object} [options]
 * @param {Number} [options.depth=0]
 */
Xml.prototype.pipeParse = function pipeParse (options = {}) {
  options.depth = options.depth || 0
  const parser = new StreamParser()

  let index = 0
  let parsedTags = new Map()
  const toEmit = []
  const lastTag = {
    index: null,
    name: null,
    tagIndex: null
  }

  const getFirstTagName = map => {
    if (map.has(0) === false) {
      return null
    }

    const mapPosZero = map.get(0)
    const arrayMap = Array.from(mapPosZero)

    if (arrayMap.length === 0) {
      return null
    }

    const keyValue = arrayMap[0]

    if (keyValue.length === 0) {
      return null
    }

    return keyValue[0]
  }

  parser.on('opentag', (name, attrs) => {
    const inheritFrom = {
      index: null,
      name: null
    }

    if (index >= 1) {
      const beforeIndex = index - 1
      const beforeKey = [
        ...parsedTags
          .get(beforeIndex)
          .keys()
      ].reverse()[0]
      inheritFrom.index = beforeIndex
      inheritFrom.name = beforeKey
    }

    if (!parsedTags.has(index)) {
      parsedTags.set(index, new Map())
    }

    if (!parsedTags.get(index).has(name)) {
      parsedTags.get(index).set(name, [])
    }

    const tag = new XmlTag(name, null, attrs, [])
    tag.inheritFrom = inheritFrom

    lastTag.index = index
    lastTag.name = name
    lastTag.tagIndex = parsedTags.get(index).get(name).push(tag) - 1
    tag.inheritFrom.tagIndex = lastTag.tagIndex
    index = index + 1
  })

  parser.on('text', (text) => {
    parsedTags
      .get(lastTag.index)
      .get(lastTag.name)[lastTag.tagIndex]
      .value = text

    lastTag.index = null
    lastTag.name = null
    lastTag.tagIndex = null
  })

  parser.on('closetag', (name) => {
    index = index - 1

    if (index === options.depth) {
      /**
       * must reorganize data to a single object
       * them emit it
      */
      let entries = Array.from(parsedTags).reverse()
      entries = entries.map(
        ([intIndex, tagsMap]) => ({
          intIndex, tagsMap: Array.from(tagsMap).reverse()
        })
      )
      entries.pop()
      entries.forEach(entry => {
        const intIndex = entry.intIndex === 0 ? entry.intIndex : entry.intIndex - 1
        const indexedTags = parsedTags.get(intIndex)

        entry.tagsMap.forEach(tag => {
          const list = tag[1]
          list.forEach(tagToBePushed => {
            indexedTags
              .get(tagToBePushed.inheritFrom.name)[0]
              .tags
              .push(tagToBePushed.reset())
          })
        })
      })

      parsedTags
        .get(index)
        .get(name)
        .forEach(tag => toEmit.push(tag.reset()))
    }

    if (name === getFirstTagName(parsedTags)) {
      parsedTags = new Map()
    }
  })

  parser.on('cdata', cdata => {
    const CData = new XmlCharacterData(cdata)
    toEmit.push(CData)
  })

  parser.on('instruction', (name, attrs) => {
    const declaration = new XmlDeclaration(attrs.version, attrs.encoding)
    toEmit.push(declaration)
  })

  return new Transform({
    objectMode: true,
    transform (chunk, encoding, ack) {
      parser.write(chunk.toString())

      if (toEmit.length > 0) {
        this.push(toEmit.shift())
      }

      ack()
    }
  })
}

/**
 * Xml.prototype.pipeStringify - stream from JS data into XML
 *
 * @param {object} [options] - all options to stringify
 * @param {object} [options.mainTag] - the wrapping tag
 * @param {string} [options.mainTag.name] - the wrapping tag's name
 */
Xml.prototype.pipeStringify = function pipeStringify (options = {}) {
  options.mainTag = options.mainTag || {}
  const defaultContent = 'FAKE_CONTENT'
  const name = options.mainTag.name
  const contents = options.mainTag.text || defaultContent
  const tag = { [name || 'fake']: contents }
  const stringified = this.stringify(tag)

  const lastIndexOfArrow = stringified.lastIndexOf('<')
  let initialTag = stringified.substr(0, lastIndexOfArrow)

  if (initialTag.indexOf(defaultContent) !== -1) {
    initialTag.replace(defaultContent, '')
  }

  let endingTag = stringified.substr(
    lastIndexOfArrow,
    stringified.length
  )

  if (Reflect.has(options.mainTag, 'name') === false) {
    const firstArrowIndex = initialTag.indexOf('>') + 1
    initialTag = initialTag.substr(0, firstArrowIndex)
    endingTag = ''
  }

  const xml = this
  let isFirstData = true

  return new Transform({
    objectMode: true,
    transform (chunk, encoding, ack) {
      const options = {
        ignoreDeclaration: true
      }

      if (isFirstData) {
        this.push(initialTag)
        isFirstData = false
      }

      const toBePushed = xml.stringify(chunk, options)
      this.push(toBePushed)

      ack()
    },
    flush (cb) {
      this.push(endingTag)
      cb()
    }
  })
}

module.exports = Xml
