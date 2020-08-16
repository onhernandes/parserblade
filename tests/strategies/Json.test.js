const Json = require('../../src/strategies/Json')
const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')
const Stream = require('stream')
const strategy = new Json()

describe('Json Strategy', function () {
  describe('Json.prototype.parse', function () {
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
  })

  describe('Json.prototype.stringify', function () {
    it('transforms JS object into JSON string', () => {
      const data = { name: 'Hernandes', package: 'parser' }
      expect(strategy.stringify(data)).toBe('{"name":"Hernandes","package":"parser"}')
    })
  })

  describe('Json.prototype.pipe', function () {
    it('throws NotImplemented error for pipe()', () => {
      expect(strategy.pipe).toThrow(NotImplemented)
    })
  })

  describe('Json.prototype.valid', function () {
    it('returns false for invalid input data', () => {
      const result = strategy.valid('}')
      expect(result).toBe(false)
    })

    it('returns true for valid array as input data', () => {
      const result = strategy.valid('[]')
      expect(result).toBe(true)
    })

    it('returns true for valid object as input data', () => {
      const result = strategy.valid('{}')
      expect(result).toBe(true)
    })
  })

  describe('Json.prototype.pipeStringify', () => {
    it('stringifies an array of objects', () => {
      const input = [{ game: 'Killing Floor' }, { game: 'Stardew Valley' }]

      const reader = new Stream.Readable({
        objectMode: true,
        read (size) {
          const next = input.shift()

          if (!next) {
            this.push(null)
          } else {
            this.push(next)
          }
        }
      })

      const result = []
      const writer = strategy.pipeStringify()
      reader.pipe(writer)

      writer.on('data', (data) => {
        result.push(data)
      })

      writer.on('error', console.log)
      writer.on('end', () => {
        const jsonString = result.join('')
        const parsed = JSON.parse(jsonString)
        expect(parsed).toEqual(expect.arrayContaining(input))
      })
    })

    it('stringifies an object', () => {
      const input = {
        services: [
          { url: 'cloud.google.com' }
        ]
      }
      const entries = Object.entries(input)

      const reader = new Stream.Readable({
        objectMode: true,
        read (size) {
          const next = entries.shift()

          if (!next) {
            this.push(null)
          } else {
            this.push(next)
          }
        }
      })

      const result = []
      const writer = strategy.pipeStringify({ type: 'object' })
      reader.pipe(writer)

      writer.on('data', (data) => {
        result.push(data)
      })

      writer.on('error', console.log)
      writer.on('end', () => {
        const jsonString = result.join('')
        const parsed = JSON.parse(jsonString)
        expect(parsed).toMatchObject(input)
      })
    })
  })
})
