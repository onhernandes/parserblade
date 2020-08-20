const { Transform, Readable } = require('stream')
const StreamParser = require('node-xml-stream')
const parser = new StreamParser()

const depth = 1
let currentDepth = 0
let hasReachedDepth = false
const mainTag = {
  tags: []
}

let currentTag = { // eslint-disable-line
  name: '',
  text: '',
  attributes: {}
}

parser.on('opentag', (name, attrs) => {
  if (currentDepth !== depth && currentTag.name === '') {
    currentDepth = currentDepth + 1
  }

  if (currentDepth === depth) {
    mainTag.name = name
    mainTag.attributes = attrs || {}
  } else {
    currentTag.name = name
    currentTag.attributes = attrs || {}
  }
})

parser.on('text', (text) => {
  if (currentTag.name !== '') {
    currentTag.text = text
  } else {
    mainTag.text = text
  }
})

parser.on('closetag', (name) => {
  if (name === currentTag.name) {
    mainTag.tags.push(
      Object.assign({}, currentTag)
    )
    currentTag.name = ''
    currentTag.text = ''
    currentTag.attributes = {}
  }

  if (name === mainTag.name) {
    hasReachedDepth = true
  }
})

const transformData = new Transform({
  objectMode: true,
  transform (chunk, encoding, ack) {
    if (hasReachedDepth) {
      this.push(Object.assign({}, mainTag))
      mainTag.name = ''
      mainTag.text = ''
      mainTag.attributes = {}
      mainTag.tags = []
      hasReachedDepth = false
      currentDepth = 0
    }

    parser.write(chunk.toString())
    ack()
  }
})

const input = `
<?xml version="1.0" encoding="utf-8"?>
<games>
  <name>Naruto Shippuden Storm 3</name>
  <platform>playstation</platform>
</games>
`.split('')
const reader = new Readable({
  read () {
    const next = input.shift()
    if (typeof next === 'string') {
      this.push(next)
    } else {
      this.push(null)
    }
  }
})

reader
  .pipe(transformData)
  .on('data', data => console.log('Data has been emitted from transform', data))
  .on('error', console.log)
  .on('end', console.log)
