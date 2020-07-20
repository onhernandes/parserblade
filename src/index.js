const {
  Json,
  Xml,
  Yaml
} = require('./strategies')
const Parser = require('./Parser')

module.exports = {
  json: new Parser(new Json()),
  xml: new Parser(new Xml()),
  yaml: new Parser(new Yaml())
}
