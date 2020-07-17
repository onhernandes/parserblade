const Json = require('../../src/strategies/Json')
const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')
const strategy = new Json()

describe('Json Strategy', function () {
  it('parses JSON object string to JS object properly', function () {
    const str = '{}'
    expect(strategy.parse(str)).toEqual({})
  })

  it('throws ParserError for invalid JSON string', function () {
    try {
      const str = '}'
      strategy.parse(str)
    } catch (e) {
      expect(e).toBeInstanceOf(ParserError)
    }
  })

  it('transforms JS object into JSON string', () => {
    const data = { name: 'Hernandes', package: 'parser' }
    expect(strategy.stringify(data)).toBe('{"name":"Hernandes","package":"parser"}')
  })

  it('throws NotImplemented error for pipe()', () => {
    expect(strategy.pipe).toThrow(NotImplemented)
  })
})
