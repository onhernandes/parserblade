const Xml = require('../../src/strategies/Xml')
const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')
const strategy = new Xml()

describe('Xml Strategy', function () {
  it('parses Xml object string to JS object properly', function () {
    const str = '{}'
    expect(strategy.parse(str)).toEqual({})
  })

  it('throws ParserError for invalid Xml string', function () {
    try {
      const str = '}'
      strategy.parse(str)
    } catch (e) {
      expect(e).toBeInstanceOf(ParserError)
    }
  })

  it('transforms JS object into Xml string', () => {
    const data = { name: 'Hernandes', package: 'parser' }
    expect(strategy.stringify(data)).toBe('{"name":"Hernandes","package":"parser"}')
  })

  it('throws NotImplemented error for pipe()', () => {
    expect(strategy.pipe).toThrow(NotImplemented)
  })
})
