# CSV

Works with CSV data. I haven't tested with xlsx or other similar data types yet.

## Usage

Both `csv.parse()` and `csv.stringify()` accepts the data to be parsed/stringified as the first argument, and an option's object as the second.

### Parse

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

#### Parse without headers

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

#### Parse with custom delimiters

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

#### Parse skipping some lines

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

#### Parse offset

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

### Stringify

