/**
 * NotImplemented
 */
function NotImplemented () {
  this.name = 'NotImplemented'
  this.message = 'This method haven\'t been implemented yet'
}

NotImplemented.prototype = new Error()

module.exports = NotImplemented
