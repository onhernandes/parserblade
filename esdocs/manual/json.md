# JSON

## Parse

There's no magic here. It just calls native's `JSON.parse`, currently there's no additional parameters.

```javascript
const assert = require('assert')
const { json } = require('parserblade')
const input = '[{"game":"Stardew Valley"}]'
const result = json.parse(input)

assert.deepStrictEqual(
  result,
  [ { game: 'Stardew Valley' } ]
)
```

## Stringify

There's no magic here. It just calls native's `JSON.stringify`, currently there's no additional parameters.

```javascript
const assert = require('assert')
const { json } = require('parserblade')
const input = [ { game: 'Stardew Valley' } ]
const result = json.stringify(input)

assert.equal(
  result,
  '[{"game":"Stardew Valley"}]'
)
```

## Valid

Just checks if given string is a valid JSON data

```javascript
const assert = require('assert')
const { json } = require('parserblade')
const result = json.valid('{')

assert.equal(
  result,
  false
)
```

## Stream

### Stringify an array

```javascript
const { json } = require('parserblade')
const { Readable } = require('stream')
const fs = require('fs')

const input = [{ game: 'Killing Floor' }, { game: 'Stardew Valley' }]
const reader = new Readable({
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

const writer = json.pipeStringify()
const toFile = fs.createWriteStream('./data-test.json')

reader
  .pipe(writer)
  .pipe(toFile)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### Stringify an object

You must pass `{ type: 'object' }` as param. Defaults to `array`. 

Data must be an array of `[ key, value ]`. Like from `Object.entries({ game: 'Stardew Valley' })`

```javascript
const { json } = require('parserblade')
const { Readable } = require('stream')
const fs = require('fs')

const input = Object.entries({
  name: 'Rodolfo'
})

const reader = new Readable({
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

const writer = json.pipeStringify({ type: 'object' })
const toFile = fs.createWriteStream('./data-test.json')

reader
  .pipe(writer)
  .pipe(toFile)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### Parse

```javascript
const { json } = require('parserblade')
const fs = require('fs')
const path = require('path')
const filepath = path.resolve(__dirname, '../data/services.json')

const reader = fs.createReadStream(filepath)
const writer = json.pipeParse()

reader
  .pipe(writer)
  .on('data', console.log)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```
