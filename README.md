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

# Read from stdin (use '-' or omit file argument)
npx parserblade parse - --to json < data.yaml
npx parserblade parse --to json --from yaml < data.yaml
```

#### Shell Pipelines

Parserblade fully supports shell pipelines for seamless data transformation workflows:

```bash
# YAML to JSON pipeline
cat data.yaml | npx parserblade parse --to json | jq '.'

# JSON to YAML with pretty printing
echo '{"name":"John","age":30}' | npx parserblade parse --to yaml

# CSV to JSON transformation
cat users.csv | npx parserblade parse --to json --pretty

# Chain multiple transformations
cat config.yaml | npx parserblade parse --to json | npx parserblade parse --to xml

# Auto-detect format in pipeline
cat unknown-format.txt | npx parserblade parse --to json

# Combine with other CLI tools
curl -s https://api.example.com/data.json | npx parserblade parse --to yaml
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

#### `hash` - Generate checksums/hashes

Generate checksums and hashes for files or stdin data with multiple algorithms.

**Syntax:**

```bash
npx parserblade hash [files...] [options]
```

**Options:**

- `-a, --algo <algorithm>` - Hash algorithm (`md5`, `sha1`, `sha256`, `sha512`) [default: `sha256`]
- `--all` - Generate all supported hash algorithms
- `--short` - Output only the hash value (no metadata)
- `--verify <hash>` - Verify file against expected hash value

**Examples:**

```bash
# Generate SHA256 hash for a file
npx parserblade hash package.json

# Generate MD5 hash
npx parserblade hash package.json --algo md5

# Generate all supported algorithms
npx parserblade hash package.json --all

# Short output (hash only)
npx parserblade hash package.json --short

# Verify file integrity
npx parserblade hash package.json --verify abc123...

# Hash multiple files
npx parserblade hash *.json

# Hash from stdin
echo "Hello World" | npx parserblade hash
cat data.txt | npx parserblade hash --algo sha512

# Pipeline usage
find . -name "*.js" -exec npx parserblade hash {} \; | grep "\.js"
```

#### `query` - Extract data using JSONPath

Extract specific parts of data files using JSONPath expressions, supporting all formats and compression.

**Syntax:**

```bash
npx parserblade query [file] <query> [options]
```

**Options:**

- `-f, --from <format>` - Input format (auto-detected if not specified)
- `-t, --to <format>` - Output format (`json`, `xml`, `csv`, `yaml`) [default: `json`]
- `--pretty` - Pretty print the output
- `--count` - Return count of matching elements instead of the elements
- `--first` - Return only the first matching element
- `--unique` - Return only unique values (removes duplicates)

**Examples:**

```bash
# Extract all user emails
npx parserblade query users.json '$.users[*].email'

# Get active users only
npx parserblade query users.json '$.users[?(@.active == true)].name' --pretty

# Count active users
npx parserblade query users.json '$.users[?(@.active == true)]' --count

# Get first user
npx parserblade query users.json '$.users[*]' --first

# Extract unique departments
npx parserblade query data.json '$.employees[*].department' --unique

# Query YAML files
npx parserblade query config.yaml '$.database.host'

# Query compressed files
npx parserblade query data.json.gz '$.results[*].value'

# Query from stdin
cat data.json | npx parserblade query - '$.items[?(@.price > 100)]'

# Complex filtering
npx parserblade query sales.json '$.transactions[?(@.amount > 1000 && @.status == "completed")].id'

# Recursive search
npx parserblade query nested.json '$..email' --unique

# Output to different formats
npx parserblade query users.yaml '$.users[*].profile' --to json --pretty
```

### Supported Formats

- **JSON** (`.json`) - JavaScript Object Notation
- **YAML** (`.yaml`, `.yml`) - YAML Ain't Markup Language
- **XML** (`.xml`) - eXtensible Markup Language
- **CSV** (`.csv`) - Comma-Separated Values

### Compression Support

Parserblade automatically handles compressed files for both input and output:

- **Gzip** (`.gz`) - GNU zip compression
- **Tar** (`.tar`) - Tape archive format
- **Tar.gz** (`.tar.gz`, `.tgz`) - Compressed tar archives
- **Zip** (`.zip`) - ZIP archive format

**Examples:**

```bash
# Parse compressed files automatically
npx parserblade parse config.json.gz --to yaml
npx parserblade parse data.csv.tar.gz --to json

# Create compressed output
npx parserblade parse data.yaml --to json --output result.json.gz
npx parserblade parse config.xml --to yaml --output config.yaml.gz

# Pipeline with compression
cat data.json | gzip | npx parserblade parse - --to yaml
```

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

## Examples

### Real-World Use Cases

#### Configuration Management

```bash
# Convert environment configs between formats
npx parserblade parse config.yaml --to json > config.json

# Transform Docker Compose to different formats
cat docker-compose.yml | npx parserblade parse --to json --pretty

# Convert package.json to YAML for documentation
npx parserblade parse package.json --to yaml > package.yaml

# Handle compressed configuration files
npx parserblade parse config.yaml.gz --to json --output config.json
npx parserblade parse settings.json --to yaml --output settings.yaml.gz
```

#### API Data Processing

```bash
# Fetch and transform API responses
curl -s https://api.github.com/users/octocat | npx parserblade parse --to yaml

# Convert API response to CSV for analysis
curl -s https://jsonplaceholder.typicode.com/users | npx parserblade parse --to csv

# Chain API calls with transformations
curl -s https://api.example.com/data.xml | npx parserblade parse --to json | jq '.users[] | select(.active == true)'

# Store API responses compressed
curl -s https://api.example.com/large-dataset.json | npx parserblade parse --to yaml --output dataset.yaml.gz

# Process compressed API dumps
npx parserblade parse api-dump.json.gz --to csv --output processed-data.csv
```

#### Data Analysis Workflows

```bash
# Convert CSV reports to JSON for processing
cat sales-report.csv | npx parserblade parse --to json | jq 'map(select(.revenue > 1000))'

# Transform log files between formats
cat access.log | npx parserblade parse --from csv --to json --pretty

# Aggregate data from multiple sources
cat config.yaml | npx parserblade parse --to json > temp.json
cat users.csv | npx parserblade parse --to json | jq --slurpfile config temp.json '{config: $config[0], users: .}'

# Extract specific data with JSONPath
npx parserblade query sales-data.json '$.transactions[?(@.amount > 1000)]' --count
npx parserblade query user-analytics.json '$.users[*].sessions[*].duration' --to csv

# Analyze nested data structures
npx parserblade query logs.json '$..errors[?(@.severity == "critical")]' --pretty
npx parserblade query metrics.yaml '$.performance.memory[?(@.usage > 80)]' --unique
```

#### Schema Validation Workflows

```bash
# Validate configuration files during CI/CD
npx parserblade validate config.yaml config.schema.json --type json-schema

# Validate API responses
curl -s https://api.example.com/user/123 | npx parserblade parse --schema user.schema.ts --schema-type zod

# Batch validate multiple files
for file in configs/*.yaml; do
  npx parserblade validate "$file" schema.json --type json-schema || echo "Invalid: $file"
done
```

### Programming Examples

#### TypeScript/JavaScript Integration

```typescript
import parserblade from "parserblade";
import { z } from "zod";

// Schema-first validation
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});

const yamlConfig = `
name: John Doe
email: john@example.com
age: 30
`;

// Parse with validation
const result = parserblade.yaml.parseWithValidation(yamlConfig, {
  validation: {
    adapter: new ZodAdapter(UserSchema),
    throwOnError: true,
  },
});

if (result.success) {
  console.log("Valid user:", result.data);
} else {
  console.error("Validation errors:", result.error);
}
```

#### Streaming Large Files

```javascript
const fs = require("fs");
const parserblade = require("parserblade");

// Stream large CSV files
fs.createReadStream("large-dataset.csv")
  .pipe(parserblade.csv.pipeParse())
  .pipe(parserblade.json.pipeStringify())
  .pipe(fs.createWriteStream("output.json"));

// Transform data on-the-fly
fs.createReadStream("config.yaml")
  .pipe(parserblade.yaml.pipeParse())
  .on("data", (data) => {
    // Process each parsed object
    console.log("Parsed:", data);
  });
```

#### Error Handling

```javascript
const parserblade = require("parserblade");

try {
  const data = parserblade.json.parse("invalid json");
} catch (error) {
  if (error.name === "ParserError") {
    console.error("Format:", error.format);
    console.error("Context:", error.context);
  }
}

// Graceful validation
const result = parserblade.yaml.validateSchema(yamlString, {
  adapter: new ZodAdapter(schema),
  throwOnError: false,
});

if (!result.success) {
  result.error.issues.forEach((issue) => {
    console.error(`${issue.path.join(".")}: ${issue.message}`);
  });
}
```

#### Hash & Checksum API

```javascript
const { Hash, hashData, hashFile } = require("parserblade");

// Generate hash from string data
const hash = Hash.data("Hello, World!", "sha256");
console.log(hash); // "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"

// Generate hash from file
const result = Hash.file("package.json", "sha256");
console.log(result);
// {
//   algorithm: "sha256",
//   hash: "abc123...",
//   file: "package.json",
//   size: 1234
// }

// Generate multiple algorithms at once
const results = Hash.fileMultiple("data.txt", ["md5", "sha256", "sha512"]);
results.forEach((result) => {
  console.log(`${result.algorithm}: ${result.hash}`);
});

// Hash verification
const isValid = Hash.verify("Hello, World!", hash, "sha256");
console.log(isValid); // true

const isFileValid = Hash.verifyFile("package.json", "expected-hash", "sha256");
console.log(isFileValid); // true or false

// Convenience functions
const md5Hash = hashData("Hello, World!", "md5");
const fileHash = hashFile("data.txt", "sha1");

// Hash Buffer data
const buffer = Buffer.from("Hello, World!", "utf8");
const bufferResult = Hash.buffer(buffer, "sha256");
console.log(bufferResult.hash);
```

#### Compression API

```javascript
const {
  Compression,
  isCompressed,
  detectCompressionFormat,
  extractFirstTextFile,
  writeCompressedFile,
  compressData,
  decompressData,
} = require("parserblade");

// Detect compression
console.log(isCompressed("config.json.gz")); // true
console.log(detectCompressionFormat("data.tar.gz")); // "tar.gz"

// Extract content from compressed files
const content = extractFirstTextFile("config.json.gz");
const parsed = JSON.parse(content);

// Compress and decompress data
const originalData = '{"name": "test", "value": 123}';
const compressed = compressData(originalData);
const decompressed = decompressData(compressed);

// Create compressed files
const yamlContent = "name: MyApp\nversion: 1.0.0";
writeCompressedFile(yamlContent, "config.yaml.gz");

// Auto-parse compressed files with parserblade
const { json } = require("parserblade");
const data = json.parse(extractFirstTextFile("data.json.gz"));
```

#### JSONPath Querying API

```javascript
const parserblade = require("parserblade");
const jsonpath = require("jsonpath");

// Parse any format to JSON for querying
const yamlContent = `
users:
  - name: John
    email: john@example.com
    active: true
  - name: Jane  
    email: jane@example.com
    active: false
`;

const data = parserblade.yaml.parse(yamlContent);

// Use JSONPath for data extraction
const emails = jsonpath.query(data, "$.users[*].email");
console.log(emails); // ['john@example.com', 'jane@example.com']

const activeUsers = jsonpath.query(data, "$.users[?(@.active == true)].name");
console.log(activeUsers); // ['John']

// Helper function for parsing and querying in one step
function queryFile(filePath, queryExpr, format = "auto") {
  const fs = require("fs");
  let content = fs.readFileSync(filePath, "utf8");

  // Auto-detect format if needed
  if (format === "auto") {
    format = parserblade.detectFormat
      ? parserblade.detectFormat(content)
      : "json";
  }

  const parser = parserblade[format];
  const data = parser.parse(content);

  return jsonpath.query(data, queryExpr);
}

// Usage examples
const userEmails = queryFile("users.yaml", "$.users[*].email");
const configValues = queryFile("config.json", "$.database.hosts[*]");
```

### Integration Examples

#### Docker & DevOps

```dockerfile
# Use in Docker for config transformation
FROM node:18-alpine
RUN npm install -g parserblade
COPY config.yaml /app/
RUN npx parserblade parse /app/config.yaml --to json > /app/config.json
```

#### GitHub Actions

```yaml
# .github/workflows/validate-config.yml
name: Validate Configurations
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - name: Validate YAML configs
        run: |
          for config in configs/*.yaml; do
            npx parserblade validate "$config" schema.json --type json-schema
          done
```

#### Package.json Scripts

```json
{
  "scripts": {
    "config:convert": "npx parserblade parse config.yaml --to json --output dist/config.json",
    "config:validate": "npx parserblade validate config.yaml config.schema.json",
    "data:transform": "cat data.csv | npx parserblade parse --to json --pretty",
    "build:configs": "npm run config:validate && npm run config:convert",
    "checksum": "npx parserblade hash dist/*.js --all > checksums.txt",
    "verify": "npx parserblade hash package.json --verify $(cat package.hash)"
  }
}
```

#### Make Integration

```makefile
# Makefile
.PHONY: convert validate clean

convert:
	npx parserblade parse config.yaml --to json --output build/config.json
	npx parserblade parse users.csv --to yaml --output build/users.yaml

validate:
	npx parserblade validate config.yaml schemas/config.schema.json
	npx parserblade validate users.csv schemas/users.schema.json

transform-logs:
	cat logs/*.csv | npx parserblade parse --to json > processed-logs.json

clean:
	rm -f build/*.json build/*.yaml processed-logs.json
```

### Advanced Scenarios

#### Data Migration

```bash
# Migrate from XML to modern formats
find ./legacy -name "*.xml" -exec sh -c 'npx parserblade parse "$1" --to yaml --output "${1%.xml}.yaml"' _ {} \;

# Batch convert configuration files
ls configs/*.toml | xargs -I {} sh -c 'npx parserblade parse {} --to json --output "json-configs/$(basename {} .toml).json"'

# Migrate compressed legacy files
find ./legacy -name "*.xml.gz" -exec sh -c 'npx parserblade parse "$1" --to yaml --output "modern/${1##*/}.yaml"' _ {} \;

# Compress during migration for space savings
find ./data -name "*.json" -exec sh -c 'npx parserblade parse "$1" --to yaml --output "compressed/$(basename "$1" .json).yaml.gz"' _ {} \;
```

#### Space-Efficient Processing

```bash
# Process large datasets with compression
npx parserblade parse large-dataset.csv --to json --output dataset.json.gz

# Chain processing with compression
cat massive-logs.json.gz | npx parserblade parse --to csv | gzip > processed-logs.csv.gz

# Archive transformed data
for file in data/*.json; do
  npx parserblade parse "$file" --to yaml --output "archive/$(basename "$file" .json).yaml.gz"
done

# Decompress, transform, and recompress
npx parserblade parse archive.json.gz --to xml --output result.xml.gz
```

#### Monitoring & Logging

```bash
# Real-time log transformation
tail -f app.log | npx parserblade parse --from json --to yaml

# Parse and filter application logs
journalctl -f | grep myapp | npx parserblade parse --from json | jq 'select(.level == "error")'
```

#### Development Utilities

```bash
# Quick data inspection
echo '{"users":[{"name":"John"},{"name":"Jane"}]}' | npx parserblade parse --to yaml --pretty

# Format validation in development
npx parserblade validate api-response.json openapi-schema.json --type json-schema

# Convert between package manager formats
npx parserblade parse package.json --to yaml > package.yaml
npx parserblade parse Cargo.toml --to json > cargo-package.json

# File integrity checking
npx parserblade hash dist/app.js --short > app.hash
npx parserblade hash dist/app.js --verify $(cat app.hash) && echo "File verified"

# Generate checksums for release artifacts
find dist -type f -name "*.js" -exec npx parserblade hash {} --short \; > release-checksums.txt

# Quick data extraction for debugging
npx parserblade query package.json '$.dependencies' --pretty
npx parserblade query tsconfig.json '$.compilerOptions.target'
npx parserblade query api-response.json '$.data[*].id' --count

# Extract environment-specific configurations
npx parserblade query config.json '$.environments.production.database'
npx parserblade query docker-compose.yml '$.services.*.environment[*]' --unique
```

#### Security & Integrity

```bash
# Generate checksums for CI/CD pipelines
npx parserblade hash package.json --algo sha256 > package.sha256
npx parserblade hash yarn.lock --algo sha512 > yarn.sha512

# Verify downloaded files
curl -sL https://example.com/file.tar.gz | npx parserblade hash --algo sha256
curl -sL https://example.com/file.tar.gz.sha256 | awk '{print $1}' | xargs npx parserblade hash file.tar.gz --verify

# Batch verification of multiple files
for file in dist/*.js; do
  if npx parserblade hash "$file" --verify "$(cat "$file.hash")" 2>/dev/null; then
    echo "✓ $file verified"
  else
    echo "✗ $file verification failed"
  fi
done
```

## License

MIT ©
