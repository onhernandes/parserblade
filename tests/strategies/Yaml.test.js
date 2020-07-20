const Yaml = require('../../src/strategies/Yaml')
const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')

describe('Yaml Parser', () => {
  it('parses YAML to JS object', () => {
    const parser = new Yaml()

    const data = 'series: Bleach\nseasons: 16'
    const result = parser.parse(data)
    expect(result).toEqual({ series: 'Bleach', seasons: 16 })
  })

  it('turns JS into YAML', () => {
    const parser = new Yaml()

    const data = { series: 'Bleach', seasons: 16 }
    const result = parser.stringify(data)
    const expected = 'series: Bleach\nseasons: 16'

    expect(result).toEqual(expect.stringMatching(expected))
  })

  it('throws ParserError when calling stringify() with array data', () => {
    const parser = new Yaml()

    try {
      parser.stringify([])
    } catch (error) {
      expect(error).toBeInstanceOf(ParserError)
    }
  })

  it('throws NotImplemented error for pipe()', () => {
    const parser = new Yaml()
    expect(parser.pipe).toThrow(NotImplemented)
  })
})
