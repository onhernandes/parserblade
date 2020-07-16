/**
 * ParseError
 */
function ParseError (format) {
  this.name = 'ParseError'
  this.message = `Failed to parse ${format}`
}

ParseError.prototype = new Error()

module.exports = ParseError
