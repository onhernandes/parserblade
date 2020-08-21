const { Transform, Readable } = require('stream')
const StreamParser = require('node-xml-stream')
const parser = new StreamParser()

const depth = 0
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
  if (currentDepth === depth) {
    mainTag.name = name
    mainTag.attributes = attrs || {}
  } else {
    currentTag.name = name
    currentTag.attributes = attrs || {}
  }

  currentDepth = currentDepth + 1
})

parser.on('text', (text) => {
  if (depth !== (currentDepth - 1)) {
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

  currentDepth = currentDepth - 1
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

      currentTag.name = ''
      currentTag.text = ''
      currentTag.attributes = {}
      currentTag.tags = []

      hasReachedDepth = false
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
