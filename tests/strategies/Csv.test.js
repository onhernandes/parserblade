const Csv = require('../../src/strategies/Csv')
const strategy = new Csv()

describe('Csv Strategy', () => {
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
