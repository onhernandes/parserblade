const Csv = require('../../src/strategies/Csv')
const strategy = new Csv()
const { Readable } = require('stream')

const input = [
  'name,email',
  'Netflix,contact@netflix.com',
  'Prime Video,contact@primevideo.com'
]

const getReader = (inputArray, options = {}) => new Readable({
  objectMode: !!options.objectMode,
  read () {
    const next = inputArray.shift()
    this.push(next || null)
  }
})

describe('Csv Strategy', () => {
  describe('Csv.prototype.parse()', function () {
    it('parse CSV string ignoring headers', () => {
      const input = 'name,email\nNetflix,contact@netflix.com'
      const result = strategy.parse(input, { headers: false })
      expect(result).toEqual([
        ['name', 'email'],
        ['Netflix', 'contact@netflix.com']
      ])
    })

    it('parse CSV string with headers', () => {
      const input = 'name,email\nNetflix,contact@netflix.com'
      const result = strategy.parse(input)

      expect(result).toEqual([
        { name: 'Netflix', email: 'contact@netflix.com' }
      ])
    })

    it('parse CSV string with custom delimiters', () => {
      const input = 'name;email\nNetflix;contact@netflix.com'
      const result = strategy.parse(input, { delimiter: ';' })

      expect(result).toEqual([
        { name: 'Netflix', email: 'contact@netflix.com' }
      ])
    })

    it('parse CSV string skipping lines', () => {
      const input = 'insights\nname,email\nNetflix,contact@netflix.com'
      const result = strategy.parse(input, { skipLines: 2 })

      expect(result).toEqual([
        { name: 'Netflix', email: 'contact@netflix.com' }
      ])
    })

    it('parse CSV string with offset', () => {
      const input = 'name,email\nNetflix,contact@netflix.com\nAmazon,contact@amazon.com'
      const result = strategy.parse(input, { offset: 2 })

      expect(result).toEqual([
        { name: 'Netflix', email: 'contact@netflix.com' }
      ])
    })
  })

  describe('Csv.prototype.stringify()', function () {
    it('turns array of objects into CSV string', () => {
      const input = [
        { name: 'Netflix', email: 'contact@netflix.com' }
      ]
      const result = strategy.stringify(input)

      expect(result).toEqual(expect.stringMatching('name,email\nNetflix,contact@netflix.com'))
    })

    it('turns array of objects into CSV string without header', () => {
      const input = [
        { name: 'Netflix', email: 'contact@netflix.com' }
      ]
      const result = strategy.stringify(input, { headers: false })

      expect(result).toEqual(expect.stringMatching('Netflix,contact@netflix.com'))
    })

    it('turns array of objects into CSV string with custom column names', () => {
      const input = [
        { name: 'Netflix', email: 'contact@netflix.com' }
      ]
      const columns = [
        { key: 'name', header: 'Platform' },
        { key: 'email', header: 'e-mail' }
      ]

      const result = strategy.stringify(input, { columns })

      expect(result).toEqual(expect.stringMatching('Platform,e-mail\nNetflix,contact@netflix.com'))
    })
  })

  describe('Csv.prototype.valid', function () {
    it('returns false for invalid input data', () => {
      const result = strategy.valid('name\nstardew,pokemon')
      expect(result).toBe(false)
    })

    it('returns true for valid input data', () => {
      const result = strategy.valid('name,email\nNetflix,contact@netflix.com')
      expect(result).toBe(true)
    })
  })

  describe('Csv.prototype.pipeParse', () => {
    it('parses with default options', () => {
      const reader = getReader(Array.from(input))
      const parsedData = []
      reader
        .pipe(strategy.pipeParse())
        .on('readable', data => {
          parsedData.push(data)
        })
        .on('error', console.log)
        .on('end', () => {
          expect(parsedData).toHaveLength(2)

          const netflix = {
            name: 'Netflix',
            email: 'contact@netflix.com'
          }
          expect(parsedData[0]).toMatchObject(netflix)

          const prime = {
            name: 'Prime Video',
            email: 'contact@primevideo.com'
          }
          expect(parsedData[1]).toMatchObject(prime)
        })
    })

    it('parses with custom options.delimiter', () => {
      const input = [
        'name;email',
        'Netflix;contact@netflix.com',
        'Prime Video;contact@primevideo.com'
      ]
      const reader = getReader(Array.from(input))
      const parsedData = []
      reader
        .pipe(strategy.pipeParse({ delimiter: ';' }))
        .on('readable', data => {
          parsedData.push(data)
        })
        .on('error', console.log)
        .on('end', () => {
          expect(parsedData).toHaveLength(2)

          const netflix = {
            name: 'Netflix',
            email: 'contact@netflix.com'
          }
          expect(parsedData[0]).toMatchObject(netflix)

          const prime = {
            name: 'Prime Video',
            email: 'contact@primevideo.com'
          }
          expect(parsedData[1]).toMatchObject(prime)
        })
    })
  })

  describe('Csv.prototype.pipeStringify', () => {
    it('stringify with default options', () => {
      const input = [
        { name: 'Netflix', site: 'netflix.com' },
        { name: 'Prime Video', site: 'primevideo.com' }
      ]
      const reader = getReader(
        Array.from(input),
        { objectMode: true }
      )

      const parsedData = []
      reader
        .pipe(strategy.pipeStringify())
        .on('readable', function () {
          let row

          while (row = this.read()) { // eslint-disable-line
            parsedData.push(row.toString())
          }
        })
        .on('error', e => { throw e })
        .on('end', () => {
          const str = parsedData[0]
          expect(str).toEqual('name,site\nNetflix,netflix.com\nPrime Video,primevideo.com\n')
        })
    })

    it('stringify with custom delimiter', () => {
      const input = [
        { name: 'Netflix', site: 'netflix.com' },
        { name: 'Prime Video', site: 'primevideo.com' }
      ]
      const reader = getReader(
        Array.from(input),
        { objectMode: true }
      )

      const parsedData = []
      reader
        .pipe(strategy.pipeStringify({ delimiter: ';' }))
        .on('readable', function () {
          let row

          while (row = this.read()) { // eslint-disable-line
            parsedData.push(row.toString())
          }
        })
        .on('error', e => { throw e })
        .on('end', () => {
          const str = parsedData[0]
          expect(str).toEqual('name;site\nNetflix;netflix.com\nPrime Video;primevideo.com\n')
        })
    })

    it('stringify with custom column', () => {
      const input = [
        { name: 'Netflix', site: 'netflix.com' },
        { name: 'Prime Video', site: 'primevideo.com' }
      ]
      const reader = getReader(
        Array.from(input),
        { objectMode: true }
      )

      const config = {
        columns: [
          { key: 'name', header: 'Name' },
          { key: 'site', header: 'Website URL' }
        ]
      }

      const parsedData = []
      reader
        .pipe(strategy.pipeStringify(config))
        .on('readable', function () {
          let row

          while (row = this.read()) { // eslint-disable-line
            parsedData.push(row.toString())
          }
        })
        .on('error', e => { throw e })
        .on('end', () => {
          const str = parsedData[0]
          expect(str).toEqual('Name,Website URL\nNetflix,netflix.com\nPrime Video,primevideo.com\n')
        })
    })

    it('stringify reordering columns', () => {
      const input = [
        { name: 'Netflix', site: 'netflix.com' },
        { name: 'Prime Video', site: 'primevideo.com' }
      ]
      const reader = getReader(
        Array.from(input),
        { objectMode: true }
      )

      const config = {
        columns: [
          { key: 'site' },
          { key: 'name' }
        ]
      }

      const parsedData = []
      reader
        .pipe(strategy.pipeStringify(config))
        .on('readable', function () {
          let row

          while (row = this.read()) { // eslint-disable-line
            parsedData.push(row.toString())
          }
        })
        .on('error', e => { throw e })
        .on('end', () => {
          const str = parsedData[0]
          expect(str).toEqual('site,name\nnetflix.com,Netflix\nprimevideo.com,Prime Video\n')
        })
    })
  })
})
