# CSV

Works with CSV data. I haven't tested with xlsx or other similar data types yet.

## Usage

Both `csv.parse()` and `csv.stringify()` accepts the data to be parsed/stringified as the first argument, and an option's object as the second.

## Parse

Parses CSV string to JS data, automatically uses first line as headers. Pass data as first argument.

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = 'title,platform\nStardew Valley,Steam'
const result = csv.parse(input)

assert.deepStrictEqual(
  result,
  [ { title: 'Stardew Valley', platform: 'Steam' } ]
)
```

### Parse headers

Don't use first line as headers. Pass `{ headers: false }` as second parameter.

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = 'name,email\nNetflix,contact@netflix.com'
const result = csv.parse(input, { headers: false })

assert.deepStrictEqual(
  result,
  [
    ['name', 'email'],
    ['Netflix', 'contact@netflix.com']
  ]
)
```

Specify headers passing `{ headers: ['name', 'email'] }`

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = 'name,email\nNetflix,contact@netflix.com'
const result = csv.parse(input, { headers: false })

assert.deepStrictEqual(
  result,
  [
    { name: 'Netflix', email: 'contact@netflix.com' }
  ]
)
```

Specify a function to transform headers passing `{ headers: header => header.toUpperCase() }`

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = 'name,email\nNetflix,contact@netflix.com'
const result = csv.parse(input, { headers: false })

assert.deepStrictEqual(
  result,
  [
    { NAME: 'Netflix', EMAIL: 'contact@netflix.com' }
  ]
)
```

### Parse with custom delimiters

Uses custom delimiters. Anything you want! Pass `{ delimiter: ';' }` as option.
```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = 'name;email\nNetflix;contact@netflix.com'
const result = csv.parse(input, { delimiter: ';' })

assert.deepStrictEqual(
  result,
  [ { name: 'Netflix', email: 'contact@netflix.com' } ]
)
```

### Parse skipping some lines

Pass `{ skipLines: 2 }` as option.

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = 'coll streaming platforms\nname,email\nNetflix,contact@netflix.com'
const result = csv.parse(input, { skipLines: 2 })

assert.deepStrictEqual(
  result,
  [ { name: 'Netflix', email: 'contact@netflix.com' } ]
)
```

### Parse offset

Pass `{ offset: 2 }` as option.

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = 'name,email\nNetflix,contact@netflix.com\nAmazon,contact@amazon.com'
const result = csv.parse(input, { offset: 2 })

assert.deepStrictEqual(
  result,
  [ { name: 'Netflix', email: 'contact@netflix.com' } ]
)
```

## Stringify

Simply transforms JS array of objects into CSV

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = [
  { name: 'Netflix', email: 'contact@netflix.com' }
]
const result = csv.stringify(input)

assert.equal(
  result,
  'name,email\nNetflix,contact@netflix.com'
)
```

### Stringify omitting headers

Pass `{ headers: false }` as options

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = [
  { name: 'Netflix', email: 'contact@netflix.com' }
]
const result = csv.stringify(input)

assert.equal(
  result,
  'Netflix,contact@netflix.com'
)
```

### Stringify with custom column names/headers

Specifying custom columns is easy in many forms, like just pass `{ columns: [ { key: '', header: '' } ] }` as options.

Or `{ columns: ['name', 'email'] }`.

Or `{ columns: { name: 'Name', email: 'Email' } }`.

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const input = [
  { name: 'Netflix', email: 'contact@netflix.com' }
]

const columns = [
  { key: 'name', header: 'Platform' },
  { key: 'email', header: 'e-mail' }
]

const result = csv.stringify(input, { columns })

assert.equal(
  result,
  'Platform,e-mail\nNetflix,contact@netflix.com'
)
```

## Valid

Just checks if given string is a valid CSV

```javascript
const assert = require('assert')
const { csv } = require('parserblade')
const result = csv.valid('name\nstardew,pokemon')

assert.equal(
  result,
  false
)
```

## Stream

### pipeStringify

Turns JS data into CSV

```javascript
const { csv } = require('parserblade')
const { Readable } = require('stream')
const fs = require('fs')

const input = [{ game: 'Killing Floor' }, { game: 'Stardew Valley' }]
const reader = new Readable({
  objectMode: true,
  read (size) {
    const next = input.shift()
    this.push(next || null)
  }
})

const writer = csv.pipeStringify()
const toFile = fs.createWriteStream('./data-test.csv')

reader
  .pipe(writer)
  .pipe(toFile)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### pipeStringify with custom delimiter

```javascript
const { csv } = require('parserblade')
const { Readable } = require('stream')
const fs = require('fs')

const input = [{ game: 'Killing Floor' }, { game: 'Stardew Valley' }]
const reader = new Readable({
  objectMode: true,
  read (size) {
    const next = input.shift()
    this.push(next || null)
  }
})

const writer = csv.pipeStringify({ delimiter: ';' })
const toFile = fs.createWriteStream('./data-test.csv')

reader
  .pipe(writer)
  .pipe(toFile)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### pipeStringify with custom column names

```javascript
const { csv } = require('parserblade')
const { Readable } = require('stream')
const fs = require('fs')

const input = [{ game: 'Killing Floor' }, { game: 'Stardew Valley' }]
const reader = new Readable({
  objectMode: true,
  read (size) {
    const next = input.shift()
    this.push(next || null)
  }
})

const columns = [
  { key: 'game', header: 'title' }
]

const writer = csv.pipeStringify({ columns })
const toFile = fs.createWriteStream('./data-test.csv')

reader
  .pipe(writer)
  .pipe(toFile)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### pipeStringify reordering columns

```javascript
const { csv } = require('parserblade')
const { Readable } = require('stream')
const fs = require('fs')

const input = [{ game: 'Killing Floor', platform: 'Windows 10' }, { game: 'Stardew Valley', platform: 'Windows 10' }]
const reader = new Readable({
  objectMode: true,
  read (size) {
    const next = input.shift()
    this.push(next || null)
  }
})

const columns = [
  { key: 'platform' },
  { key: 'game' }
]

const writer = csv.pipeStringify({ columns })
const toFile = fs.createWriteStream('./data-test.csv')

reader
  .pipe(writer)
  .pipe(toFile)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### pipeParse

```javascript
const { csv } = require('parserblade')
const fs = require('fs')
const path = require('path')
const filepath = path.resolve(__dirname, '../data/services.csv')

const reader = fs.createReadStream(filepath)
const writer = csv.pipeParse()

reader
  .pipe(writer)
  .on('readable', console.log)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### pipeParse setting custom delimiter

```javascript
const { csv } = require('parserblade')
const fs = require('fs')
const path = require('path')
const filepath = path.resolve(__dirname, '../data/services.csv')

const reader = fs.createReadStream(filepath)
const writer = csv.pipeParse({ delimiter: ';' })

reader
  .pipe(writer)
  .on('readable', console.log)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```

### pipeParse without using first line as header

```javascript
const { csv } = require('parserblade')
const fs = require('fs')
const path = require('path')
const filepath = path.resolve(__dirname, '../data/services.csv')

const reader = fs.createReadStream(filepath)
const writer = csv.pipeParse({ headers: false })

reader
  .pipe(writer)
  .on('readable', console.log)
  .on('error', console.log)
  .on('end', () => {
    console.log('done')
  })
```
