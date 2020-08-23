const Xml = require('../../src/strategies/Xml')
const ParserError = require('../../src/errors/ParserError')
const NotImplemented = require('../../src/errors/NotImplemented')
const strategy = new Xml()
const { Readable } = require('stream')
const { XmlTag, XmlDeclaration } = require('../../src/strategies/Xml/XmlTag')

const input = `
<?xml version="1.0" encoding="utf-8"?>
<games>
  <name>Naruto Shippuden Storm 3</name>
  <platform>
    platform
    <another>
      This is another tag
    </another>
    <another>
      Third tag another
    </another>
  </platform>
  <site url="netflix">
    Netflix
    <description>
      Possible description here
    </description>
  </site>
</games>
`.split('')

const getReader = inputArray => new Readable({
  read () {
    const next = inputArray.shift()
    if (typeof next === 'string') {
      this.push(next)
    } else {
      this.push(null)
    }
  }
})

describe('Xml Strategy', function () {
  describe('Xml.prototype.setXmlDeclaration()', function () {
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
  })

  describe('Xml.prototype.stringify()', function () {
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
  })

  describe('Xml.prototype.parse()', function () {
    it('parses XML string to JS object in verbose mode', function () {
      const data = '<?xml version="1.0" encoding="utf-8"?><games><name>Naruto Shippuden Storm 3</name><platform>playstation</platform></games>'
      const expected = {
        elements: [
          {
            type: 'element',
            name: 'games',
            elements: [
              {
                type: 'element',
                name: 'name',
                elements: [
                  {
                    type: 'text',
                    text: 'Naruto Shippuden Storm 3'
                  }
                ]
              },
              {
                type: 'element',
                name: 'platform',
                elements: [
                  {
                    type: 'text',
                    text: 'playstation'
                  }
                ]
              }
            ]
          }
        ]
      }
      const result = strategy.parse(data, { verbose: true })
      expect(result).toStrictEqual(expected)
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
  })

  describe('Xml.prototype.pipe()', function () {
    it('throws NotImplemented error for pipe()', () => {
      expect(strategy.pipe).toThrow(NotImplemented)
    })
  })

  describe('Xml.prototype.valid()', function () {
    it('returns false for invalid input data', () => {
      const result = strategy.valid('phrase<tag />')
      expect(result).toBe(false)
    })

    it('returns true for valid input data', () => {
      const result = strategy.valid('<game>Stardew Valley</game>')
      expect(result).toBe(true)
    })
  })

  describe('Xml.prototype.pipeParse', () => {
    it('parses with default options.depth', () => {
      const reader = getReader(Array.from(input))
      const toExpect = {
        declaration: data => {
          expect(data).toBeInstanceOf(XmlDeclaration)
          expect(data.version).toEqual('1.0')
          expect(data.encoding).toEqual('utf-8')
        },
        games: data => {
          expect(data).toBeInstanceOf(XmlTag)
          expect(data.tags).toHaveLength(3)
        }
      }
      reader
        .pipe(strategy.pipeParse())
        .on('data', data => {
          toExpect[data.name](data)
        })
        .on('error', console.log)
        .on('end', () => {})
    })

    it('parses with custom options.depth 1', () => {
      const reader = getReader(Array.from(input))
      const toExpect = {
        declaration: data => {
          expect(data).toBeInstanceOf(XmlDeclaration)
          expect(data.version).toEqual('1.0')
          expect(data.encoding).toEqual('utf-8')
        },
        name: data => {
          expect(data).toBeInstanceOf(XmlTag)
          expect(data.tags).toHaveLength(0)
        },
        platform: data => {
          expect(data).toBeInstanceOf(XmlTag)
          expect(data.tags).toHaveLength(2)
        },
        site: data => {
          expect(data).toBeInstanceOf(XmlTag)
          expect(data.tags).toHaveLength(1)
        }
      }
      reader
        .pipe(strategy.pipeParse({ depth: 1 }))
        .on('data', data => {
          toExpect[data.name](data)
        })
        .on('error', console.log)
        .on('end', () => {})
    })
  })
})
