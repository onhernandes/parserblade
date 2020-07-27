# JSON

## Usage

### Parse

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

### Stringify

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

### Valid

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
