/**
 * ParseError
 *
 * @param {string} format - which format the error ocurred
 * @param {object} context - any context info for debugging
 */
function ParseError (format, context = {}) {
  this.name = 'ParseError'
  this.message = `Failed to parse ${format}`
  this.context = context
}

ParseError.prototype = new Error()

module.exports = ParseError
