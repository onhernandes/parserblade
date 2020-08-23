function XmlDeclaration (version, encoding) {
  this.name = 'declaration'
  this.version = version
  this.encoding = encoding
}

function XmlTag (name, value, attributes, tags) {
  this.name = name
  this.value = value
  this.attributes = attributes
  this.tags = tags
}

XmlTag.prototype.reset = function reset () {
  return new XmlTag(this.name, this.value, this.attributes, this.tags)
}

function XmlCharacterData (cdata) {
  this.name = 'cdata'
  this.cdata = cdata
}

module.exports = { XmlTag, XmlDeclaration, XmlCharacterData }
