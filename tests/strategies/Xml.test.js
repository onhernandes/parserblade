const Xml = require('../../src/strategies/Xml')
const ParserError = require('../../src/errors/ParserError')
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

  it('parses XML string to JS object', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package></packages>'
    const expected = {
      packages: {
        name: { _text: 'Hernandes' },
        package: { _text: 'parser' }
      }
    }
    const result = strategy.parse(data)
    expect(result).toStrictEqual(expected)
  })

  it('parses XML string to JS object array', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package><name>Hernandes</name><package>parser</package></packages>'
    const expected = {
      packages: {
        name: [
          { _text: 'Hernandes' },
          { _text: 'Hernandes' }
        ],
        package: [
          { _text: 'parser' },
          { _text: 'parser' }
        ]
      }
    }
    const result = strategy.parse(data)
    expect(result).toStrictEqual(expected)
  })

  it('throws ParserError for missing parent tag', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><name>Hernandes</name><package>parser</package><name>Hernandes</name><package>parser</package>'
    try {
      strategy.parse(data)
    } catch (error) {
      expect(error).toBeInstanceOf(ParserError)
    }
  })

  it('parses XML string, including _declaration', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package><name>Hernandes</name><package>parser</package></packages>'
    const expected = {
      _declaration: {
        _attributes: {
          encoding: 'utf-8',
          version: 1
        }
      },
      packages: {
        name: [
          { _text: 'Hernandes' },
          { _text: 'Hernandes' }
        ],
        package: [
          { _text: 'parser' },
          { _text: 'parser' }
        ]
      }
    }
    const result = strategy.parse(data, { showDeclaration: true })
    expect(result).toStrictEqual(expected)
  })

  it('throws NotImplemented error for pipe()', () => {
    expect(strategy.pipe).toThrow(NotImplemented)
  })
})
