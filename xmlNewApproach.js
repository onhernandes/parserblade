const { Transform, Readable } = require('stream')
const StreamParser = require('node-xml-stream')
const parser = new StreamParser()
const util = require('util')
const { XmlTag } = require('./src/strategies/Xml/XmlTag')

const depth = 1

let index = 0
let parsedTags = new Map()
const lastTag = {
  index: null,
  name: null,
  tagIndex: null
}

const getFirstTagName = map => {
  if (map.has(0) === false) {
    return null
  }

  const mapPosZero = map.get(0)
  const arrayMap = Array.from(mapPosZero)

  if (arrayMap.length === 0) {
    return null
  }

  const keyValue = arrayMap[0]

  if (keyValue.length === 0) {
    return null
  }

  return keyValue[0]
}

parser.on('opentag', (name, attrs) => {
  const inheritFrom = {
    index: null,
    name: null
  }

  if (index >= 1) {
    const beforeIndex = index - 1
    const beforeKey = [
      ...parsedTags
        .get(beforeIndex)
        .keys()
    ].reverse()[0]
    inheritFrom.index = beforeIndex
    inheritFrom.name = beforeKey
  }

  if (!parsedTags.has(index)) {
    parsedTags.set(index, new Map())
  }

  if (!parsedTags.get(index).has(name)) {
    parsedTags.get(index).set(name, [])
  }

  const tag = new XmlTag(name, null, attrs, [])
  tag.inheritFrom = inheritFrom

  lastTag.index = index
  lastTag.name = name
  lastTag.tagIndex = parsedTags.get(index).get(name).push(tag) - 1
  index = index + 1
})

parser.on('text', (text) => {
  parsedTags
    .get(lastTag.index)
    .get(lastTag.name)[lastTag.tagIndex]
    .value = text

  lastTag.index = null
  lastTag.name = null
  lastTag.tagIndex = null
})

parser.on('closetag', (name) => {
  index = index - 1
  if (index === depth) {
    /**
     * must reorganize data to a single object
     * them emit it
     */
    let entries = Array.from(parsedTags).reverse()
    entries = entries.map(
      ([intIndex, tagsMap]) => ({
        intIndex, tagsMap: Array.from(tagsMap).reverse()
      })
    )
    entries.pop()
    entries.forEach(entry => {
      const intIndex = entry.intIndex === 0 ? entry.intIndex : entry.intIndex - 1
      const indexedTags = parsedTags.get(intIndex)

      entry.tagsMap.forEach(tag => {
        const list = tag[1]
        list.forEach(tagToBePushed => {
          indexedTags
            .get(tagToBePushed.inheritFrom.name)[0]
            .tags
            .push(tagToBePushed)
        })
        console.log({
          list: list[0],
          index: entry.intIndex,
          indexedTags: indexedTags.get(list[0].inheritFrom.name)[0]
        })
        /*
        */
      })
    })
    // console.log(util.inspect(parsedTags.get(index), false, 5, true))
    // console.log(util.inspect(entries[0], false, 5, true))
  }

  if (name === getFirstTagName(parsedTags)) {
    parsedTags = new Map()
  }

  // console.log('closetag', { name, index })
})

const transformData = new Transform({
  objectMode: true,
  transform (chunk, encoding, ack) {
    parser.write(chunk.toString())
    ack()
  }
})

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
  .on('data', data =>
    console.log(
      'Data has been emitted from transform',
      util.inspect(data, false, 5, true)
    )
  )
  .on('error', console.log)
  .on('end', console.log)
