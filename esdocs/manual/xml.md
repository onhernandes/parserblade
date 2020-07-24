# XML

Works with XML data. I haven't tested with xlsx or other similar data types yet. There's a lot of things to improve here.

## Usage

Both `xml.parse()` and `xml.stringify()` accepts the data to be parsed/stringified as the first argument, and an option's object as the second.

### Parse

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package><name>Hernandes</name><package>parser</package></packages>'
const result = xml.parse(input)

assert.deepStrictEqual(
  result,
  {
    packages: {
      name: { _text: 'Hernandes' },
      package: { _text: 'parser' }
    }
  }
)
```

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package></packages>'
const result = xml.parse(input)

assert.deepStrictEqual(
  result,
  {
    packages: {
      name: [
        { _text: 'Hernandes' },
        { _text: 'Hernandes' }
      ],
      package: [
        { _text: 'parser' },
        { _text: 'parser' }
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
const input = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package></packages>'
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
        { _text: 'Hernandes' },
        { _text: 'Hernandes' }
      ],
      package: [
        { _text: 'parser' },
        { _text: 'parser' }
      ]
    }
  }
)
```

### Stringify

```javascript
const assert = require('assert')
const { xml } = require('parserblade')
const input = '<?xml version="1.0" encoding="utf-8"?><packages><name>Hernandes</name><package>parser</package></packages>'
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
        { _text: 'Hernandes' },
        { _text: 'Hernandes' }
      ],
      package: [
        { _text: 'parser' },
        { _text: 'parser' }
      ]
    }
  }
)
```
