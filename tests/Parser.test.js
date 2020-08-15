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

  it('calls pipeStringify() strategy method', () => {
    const mock = { pipeStringify: jest.fn() }
    const parser = new Parser(mock)
    parser.pipeStringify()
    expect(mock.pipeStringify).toHaveBeenCalled()
  })

  it('calls pipeParse() strategy method', () => {
    const mock = { pipeParse: jest.fn() }
    const parser = new Parser(mock)
    parser.pipeParse()
    expect(mock.pipeParse).toHaveBeenCalled()
  })
})
