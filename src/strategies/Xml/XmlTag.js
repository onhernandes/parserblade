function XmlResult (declaration, tags) {
  this.declaration = declaration
  this.content = tags
}

function XmlDeclaration (version, encoding) {
  this.version = version
  this.encoding = encoding
}

function XmlTag (name, value, attributes, tags) {
  this.name = name
  this.value = value
  this.attributes = attributes
  this.tags = tags
}

module.exports = { XmlTag, XmlResult, XmlDeclaration }
