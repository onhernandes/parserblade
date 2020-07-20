# parser

A all-in-one parser for Javascript, heavily inspired by: https://github.com/nathanmac/Parser. It allows you to work with JSON, XML, CSV and YAML more without worrying about which module install. It's designed to work just as `JSON.parse` and `JSON.stringify` does, with some improvements.

## Installation

```sh
$ npm install --save parser
```

## Usage

Every filetype has two main methods: `stringify()` and `parse()`, both receives two arguments, `data` containing any type of data and an options object.

```js
const parser = require('parser')
```
## License

MIT © [Matheus Hernandes](onhernandes.github.io)
