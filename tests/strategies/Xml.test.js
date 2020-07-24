const Xml = require('../../src/strategies/Xml')
const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')
const strategy = new Xml()

describe('Xml Strategy', function () {
  it('puts XML declaration on first position within array', () => {
    const data = [{ language: 'nodejs' }]
    const result = strategy.setXmlDeclaration(data)
    expect(result[0]).toEqual(strategy.XML_VERSION_TAG)
  })

  it('puts XML declaration on first position within object', () => {
    const data = { language: 'nodejs' }
    const result = strategy.setXmlDeclaration(data)
    const keys = Object.keys(result)
    expect(keys[0]).toEqual('_declaration')
  })

  it('transforms JS object into Xml string', () => {
    const data = { game: 'Stardew Valley' }
    const expected = '<?xml version="1.0" encoding="utf-8"?><game>Stardew Valley</game>'
    expect(strategy.stringify(data)).toBe(expected)
  })

  it('transforms JS object into XML string without xml version', () => {
    const data = { game: 'Stardew Valley' }
    const expected = '<game>Stardew Valley</game>'
    const result = strategy.stringify(data, { ignoreDeclaration: true })
    expect(result).toBe(expected)
  })

  it('transforms JS array into XML string', () => {
    const data = {
      packages: [
        { name: 'lodash' }
      ]
    }
    const expected = '<?xml version="1.0" encoding="utf-8"?><packages><name>lodash</name></packages>'
    const result = strategy.stringify(data)
    expect(result).toBe(expected)
  })

  it('parses XML string to JS object', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><games><name>Naruto Shippuden Storm 3</name><platform>playstation</platform></games>'
    const expected = {
      games: {
        name: { _text: 'Naruto Shippuden Storm 3' },
        platform: { _text: 'playstation' }
      }
    }
    const result = strategy.parse(data)
    expect(result).toStrictEqual(expected)
  })

  it('parses XML string to JS object array', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>'
    const expected = {
      packages: {
        name: [
          { _text: 'mongoose' },
          { _text: 'sequelize' }
        ]
      }
    }
    const result = strategy.parse(data)
    expect(result).toStrictEqual(expected)
  })

  it('throws ParserError for missing parent tag', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>'
    try {
      strategy.parse(data)
    } catch (error) {
      expect(error).toBeInstanceOf(ParserError)
    }
  })

  it('parses XML string, including _declaration', function () {
    const data = '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>'
    const expected = {
      _declaration: {
        _attributes: {
          encoding: 'utf-8',
          version: 1
        }
      },
      packages: {
        name: [
          { _text: 'mongoose' },
          { _text: 'sequelize' }
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
