# XML

Works with XML data. I haven't tested with xlsx or other similar data types yet. There's a lot of things to improve here.

## Usage

Both `xml.parse()` and `xml.stringify()` accepts the data to be parsed/stringified as the first argument, and an option's object as the second.

### Parse

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = '<?xml version="1.0" encoding="utf-8"?><games><name>Naruto Shippuden Storm 3</name><platform>playstation</platform></games>'
const result = xml.parse(input)

assert.deepStrictEqual(
  result,
  {
    games: {
      name: { _text: 'Naruto Shippuden Storm 3' },
      platform: { _text: 'playstation' }
    }
  }
)
```

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>'
const result = xml.parse(input)

assert.deepStrictEqual(
  result,
  {
    packages: {
      name: [
        { _text: 'mongoose' },
        { _text: 'sequelize' }
      ]
    }
  }
)
```

#### Parse XML including declaration

Pass `{ showDeclaration: true }` as option.

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>'
const result = xml.parse(input, { showDeclaration: true })

assert.deepStrictEqual(
  result,
  {
    _declaration: {
      _attributes: {
        encoding: 'utf-8',
        version: 1
      }
    },
    packages: {
      name: [
        { _text: 'mongoose' },
        { _text: 'sequelize' }
      ]
    }
  }
)
```

### Stringify

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = { game: 'Stardew Valley' }
const result = xml.stringify(input)

assert.deepStrictEqual(
  result,
  '<?xml version="1.0" encoding="utf-8"?><game>Stardew Valley</game>'
)
```

#### Stringify without XML declaration

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = { game: 'Stardew Valley' }
const result = xml.stringify(input, { ignoreDeclaration: true })

assert.deepStrictEqual(
  result,
  '<game>Stardew Valley</game>'
)
```

#### Stringify array

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = {
  packages: [
    { name: 'lodash' }
  ]
}
const result = xml.stringify(input)

assert.deepStrictEqual(
  result,
  '<?xml version="1.0" encoding="utf-8"?><packages><name>lodash</name></packages>'
)
```
