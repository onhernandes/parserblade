const Xml = require('../../src/strategies/Xml')
// const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')
const strategy = new Xml()

describe('Xml Strategy', function () {
  it('puts XML declaration on first position within array', () => {
    const data = [{ package: 'parser' }]
    const result = strategy.setXmlDeclaration(data)
    expect(result[0]).toEqual(strategy.XML_VERSION_TAG)
  })

  it('puts XML declaration on first position within object', () => {
    const data = { package: 'parser' }
    const result = strategy.setXmlDeclaration(data)
    const keys = Object.keys(result)
    expect(keys[0]).toEqual('_declaration')
  })

  it('transforms JS object into Xml string', () => {
    const data = { name: 'Hernandes', package: 'parser' }
    const expected = '<?xml version="1.0" encoding="utf-8"?><name>Hernandes</name><package>parser</package>'
    expect(strategy.stringify(data)).toBe(expected)
  })

  it('transforms JS object into XML string without xml version', () => {
    const data = { name: 'Hernandes', package: 'parser' }
    const expected = '<name>Hernandes</name><package>parser</package>'
    const result = strategy.stringify(data, { ignoreDeclaration: true })
    expect(result).toBe(expected)
  })

  it('transforms JS array into XML string', () => {
    const data = { packages: [{ name: 'Hernandes', package: 'parser' }] }
    const expected = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package></packages>'
    const result = strategy.stringify(data)
    expect(result).toBe(expected)
  })

  it('throws NotImplemented error for parse()', function () {
    expect(strategy.parse).toThrow(NotImplemented)
  })

  it('throws NotImplemented error for pipe()', () => {
    expect(strategy.pipe).toThrow(NotImplemented)
  })
})
