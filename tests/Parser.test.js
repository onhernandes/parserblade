const Parser = require('../src/Parser')

describe('Parser implements Strategy', () => {
  it('calls parse() strategy method', () => {
    const mock = { parse: jest.fn() }
    const parser = new Parser(mock)
    parser.parse()
    expect(mock.parse).toHaveBeenCalled()
  })

  it('calls stringify() strategy method', () => {
    const mock = { stringify: jest.fn() }
    const parser = new Parser(mock)
    parser.stringify()
    expect(mock.stringify).toHaveBeenCalled()
  })

  it('calls valid() strategy method', () => {
    const mock = { valid: jest.fn() }
    const parser = new Parser(mock)
    parser.valid()
    expect(mock.valid).toHaveBeenCalled()
  })
})
