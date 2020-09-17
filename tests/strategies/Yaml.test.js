const Yaml = require('../../src/strategies/Yaml')
const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')

const strategy = new Yaml()

describe('Yaml Parser', () => {
  describe('Yaml.prototype.parse()', function () {
    it('parses YAML to JS object', () => {
      const data = 'series: Bleach\nseasons: 16'
      const result = strategy.parse(data)
      expect(result).toEqual({ series: 'Bleach', seasons: 16 })
    })
  })

  describe('Yaml.prototype.stringify()', function () {
    it('turns JS into YAML', () => {
      const data = { series: 'Bleach', seasons: 16 }
      const result = strategy.stringify(data)
      const expected = 'series: Bleach\nseasons: 16'

      expect(result).toEqual(expect.stringMatching(expected))
    })

    it('throws ParserError when calling stringify() with array data', () => {
      try {
        strategy.stringify([])
      } catch (error) {
        expect(error).toBeInstanceOf(ParserError)
      }
    })
  })

  describe('Yaml.prototype.pipe()', function () {
    it('throws NotImplemented error for pipe()', () => {
      expect(strategy.pipe).toThrow(NotImplemented)
    })
  })

  describe('Yaml.prototype.valid()', function () {
    it('returns false for invalid input data', () => {
      const result = strategy.valid('[name:\nStardew')
      expect(result).toBe(false)
    })

    it('returns true for valid input data', () => {
      const result = strategy.valid('name:"Stardew Valley"')
      expect(result).toBe(true)
    })
  })
})
