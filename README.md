# parserblade

![CI](https://github.com/onhernandes/parserblade/workflows/CI/badge.svg?branch=main)

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
const { csv } = require("parserblade");

// Parsing
const input = "title,platform\nStardew Valley,Steam";
const result = csv.parse(input);
console.log(result); // [ { title: 'Stardew Valley', platform: 'Steam' } ]

// Stringifying
console.log(csv.stringify(result)); // 'title,platform\nStardew Valley,Steam'
```

### YAML

```javascript
const { yaml } = require("parserblade");

// Parsing
const input = "title: Stardew Valley\nplatform: Steam";
const result = yaml.parse(input);
console.log(result); // { title: 'Stardew Valley', platform: 'Steam' }

// Stringifying
console.log(yaml.stringify(result)); // 'title: Stardew Valley\nplatform: Steam'
```

### XML

```javascript
const { xml } = require("parserblade");

// Parsing
const input = '<?xml version="1.0" encoding="utf-8"?><package>lodash</package>';
const result = xml.parse(input);
console.log(result); // { package: 'lodash' }

// Stringifying
console.log(xml.stringify(result)); // '<?xml version="1.0" encoding="utf-8"?><package>lodash</package>'
```

## CLI Commands

Parserblade v2 includes a powerful CLI that can be run using `npx parserblade` or installed globally.

### Installation & Usage

```bash
# Run directly with npx (recommended)
npx parserblade --help

# Or install globally
npm install -g parserblade
parserblade --help
```

### Commands

#### `parse` - Convert between formats

Parse a file and convert it to another format with optional validation.

**Syntax:**

```bash
npx parserblade parse <file> [options]
```

**Options:**

- `-t, --to <format>` - Output format (`json`, `xml`, `csv`, `yaml`)
- `-o, --output <file>` - Output file (default: stdout)
- `-f, --from <format>` - Input format (auto-detected if not specified)
- `--pretty` - Pretty print the output (for JSON and YAML)
- `--minify` - Minify the output
- `--schema <file>` - Schema file to validate against during parsing
- `--schema-type <type>` - Schema type (`zod`, `joi`, `json-schema`) [default: `zod`]
- `--validate-throw` - Throw on validation error (default: false)

**Examples:**

```bash
# Convert CSV to JSON
npx parserblade parse data.csv --to json

# Convert YAML to XML with pretty printing
npx parserblade parse config.yaml --to xml --pretty

# Convert and save to file
npx parserblade parse data.csv --to json --output result.json

# Parse with schema validation
npx parserblade parse user.json --schema user.schema.ts --schema-type zod

# Auto-detect input format, convert to YAML
npx parserblade parse input.unknown --to yaml
```

#### `validate` - Validate against schema

Validate a file against a schema without conversion.

**Syntax:**

```bash
npx parserblade validate <file> <schema> [options]
```

**Options:**

- `-f, --format <format>` - Input format (auto-detected if not specified)
- `-t, --type <type>` - Schema type (`zod`, `joi`, `json-schema`) [default: `zod`]
- `--throw` - Throw on validation error (default: false)

**Examples:**

```bash
# Validate JSON with Zod schema
npx parserblade validate user.json user.schema.ts --type zod

# Validate YAML with JSON Schema
npx parserblade validate config.yaml config.schema.json --type json-schema

# Validate CSV with Joi schema
npx parserblade validate data.csv data.schema.js --type joi

# Force input format and validate
npx parserblade validate data.txt --format json user.schema.ts
```

### Supported Formats

- **JSON** (`.json`) - JavaScript Object Notation
- **YAML** (`.yaml`, `.yml`) - YAML Ain't Markup Language
- **XML** (`.xml`) - eXtensible Markup Language
- **CSV** (`.csv`) - Comma-Separated Values

### Schema Validation

The CLI supports three schema validation libraries:

1. **Zod** (`.ts`, `.js`) - TypeScript-first schema validation
2. **Joi** (`.js`) - Object schema validation for Node.js
3. **JSON Schema** (`.json`) - JSON Schema Draft 7

**Schema File Examples:**

Zod schema (`user.schema.ts`):

```typescript
import { z } from "zod";

export const schema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});
```

Joi schema (`user.schema.js`):

```javascript
const Joi = require("joi");

module.exports = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(0).required(),
});
```

JSON Schema (`user.schema.json`):

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "number", "minimum": 0 }
  },
  "required": ["name", "email", "age"]
}
```

## License

MIT ©
