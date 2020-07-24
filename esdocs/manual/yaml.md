# YAML

## Usage

Both `yaml.parse()` and `yaml.stringify()` accepts the data to be parsed/stringified as the first argument, and an option's object as the second.

### Parse

```javascript
const assert = require('assert'')
const { yaml } = require('parserblade')
const input = 'series: Bleach\nseasons: 16'
const result = yaml.parse(data)
assert.deepStrictEqual(
  result,
  { series: 'Bleach', seasons: 16 }
)
```

### Stringify

```javascript
const assert = require('assert'')
const { yaml } = require('parserblade')
const input = { series: 'Bleach', seasons: 16 }
const result = yaml.parse(data)
assert.equal(
  result,
  'series: Bleach\nseasons: 16'
)
```
