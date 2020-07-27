# parserblade

A all-in-one parser for Javascript, heavily inspired by: https://github.com/nathanmac/Parser. It allows you to work with JSON, XML, CSV and YAML more without worrying about which module install. It's designed to work just as `JSON.parse` and `JSON.stringify` does, with some improvements.

See [docs](https://onhernandes.github.io/parserblade) for more info and examples.

## Installation

```sh
$ npm install --save parserblade
```

## Usage

Every filetype has two main methods: `stringify()` and `parse()`, both receives two arguments, `data` containing any type of data and an options object.

### CSV

```javascript
const { csv } = require('parserblade')

// Parsing
const input = 'title,platform\nStardew Valley,Steam'
const result = csv.parse(input)
console.log(result) // [ { title: 'Stardew Valley', platform: 'Steam' } ]

// Stringifying
console.log(
  csv.stringify(result)
) // 'title,platform\nStardew Valley,Steam'
```

### YAML

```javascript
const { yaml } = require('parserblade')

// Parsing
const input = 'title: Stardew Valley\nplatform: Steam'
const result = yaml.parse(input)
console.log(result) // { title: 'Stardew Valley', platform: 'Steam' }

// Stringifying
console.log(
  yaml.stringify(result)
) // 'title: Stardew Valley\nplatform: Steam'
```

### XML

```javascript
const { xml } = require('parserblade')

// Parsing
const input = '<?xml version="1.0" encoding="utf-8"?><package>lodash</package>'
const result = xml.parse(input)
console.log(result) // { package: 'lodash' }

// Stringifying
console.log(
  xml.stringify(result)
) // '<?xml version="1.0" encoding="utf-8"?><package>lodash</package>'
```

## License

MIT ©
