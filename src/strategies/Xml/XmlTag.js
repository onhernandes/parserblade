function XmlResult (declaration, tags) {
  this.declaration = declaration
  this.tags = tags
}

function XmlTag (name, text, attributes, tags) {
  this.name = name
  this.text = text
  this.attributes = attributes
  this.tags = tags
}

module.exports = { XmlTag, XmlResult }
