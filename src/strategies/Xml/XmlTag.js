function XmlResult (declaration, tags) {
  this.declaration = declaration
  this.content = tags
}

function XmlTag (name, value, attributes, tags) {
  this.name = name
  this.value = value
  this.attributes = attributes
  this.tags = tags
}

module.exports = { XmlTag, XmlResult }
