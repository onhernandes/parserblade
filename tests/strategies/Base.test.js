const Base = require('../../src/strategies/Base')
const NotImplemented = require('../../src/errors/NotImplemented')

function Implementation () {}

Implementation.prototype = Object.create(Base.prototype)

const instance = new Implementation()

describe('Base Strategy implementation', function () {
  it('throws NotImplemented for stringify() method', () => {
    expect(instance.stringify).toThrow(NotImplemented)
  })

  it('throws NotImplemented for parse() method', () => {
    expect(instance.parse).toThrow(NotImplemented)
  })

  it('throws NotImplemented for pipe() method', () => {
    expect(instance.pipe).toThrow(NotImplemented)
  })
})
