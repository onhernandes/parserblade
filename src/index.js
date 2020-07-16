const Json = require('./strategies/Json')
const Parser = require('./Parser')

module.exports = {
  json: new Parser(Json)
}
