# 🗡️ Parserblade — Feature Ideas

A set of feature suggestions focused on improving **Developer Experience (DX)**, supporting **more file types**, and offering a **CLI interface**.

---

## 🚀 High Impact Features (Fast Wins)

- **npx CLI Tool**  
  Easily convert between formats directly from the terminal.  
  Example:

  ```
  npx parserblade parse data.xml --to json
  ```

- **Automatic Format Detection**  
  Parse or stringify based on file content, no need to specify formats explicitly.

- **Pretty Print & Minify Options**  
  Output prettified or minified versions via both API and CLI.  
  Example:

  ```
  parserblade.stringify(obj, { pretty: true })
  ```

- **Format Validation**  
  Validate syntax correctness without parsing.  
  CLI Example:

  ```
  npx parserblade validate data.yaml
  ```

- **Clipboard Support**  
  Output parsing results directly to clipboard.  
  Example:

  ```
  npx parserblade parse data.yaml --to json --copy
  ```

- **Output to Stdout or File Automatically**  
  If --output isn't set, pipe output to stdout by default.

- **Inline Conversion for Shell Pipelines**  
  Accept input from stdin and pipe output forward.  
  Example:

  ```
  cat data.yaml | npx parserblade parse --to json | jq '.'
  ```

- **Multi-File Batch Processing**  
  Accept multiple input files or folders and convert them.  
  Example:

  ```
  npx parserblade parse ./data/*.yaml --to json --output ./output/
  ```

- **Watch Mode for CLI**  
  Automatically parse files when they change.  
  Example:

  ```
  npx parserblade parse data.yaml --to json --watch
  ```

- **File Merge Tool**  
  Merge multiple JSON, YAML, or CSV files into one unified file.

---

## 📄 New File Formats Support

- **TOML** – Common in modern config ecosystems (Rust, Python).
- **INI** – Classic configuration file format.
- **JSON Lines (JSONL/NDJSON)** – Line-delimited JSON for logs and large datasets.
- **.env / .properties File Support** – Parse simple key-value configuration files.
- **Markdown Frontmatter Parsing** – Extract YAML or JSON frontmatter from Markdown files.
- **Excel (.xlsx) Support** – Read from and write to Excel files, mapping sheets to JSON or CSV.
- **SQL Export** – Convert CSV, JSON, or YAML into SQL INSERT statements or .sql dumps.

---

## 💡 Advanced Functionality

- **Partial Parsing / Querying**  
  Extract parts of files using selectors like JSONPath, XPath, or CSV columns.  
  Example:

  ```
  npx parserblade query data.json '$.users[*].email'
  ```

  Also, try to do this using streams.

- **Format Diff Tool**  
  Compare two files of the same or different formats and output the differences.  
  Example:

  ```
  npx parserblade diff file1.yaml file2.json
  ```

- **Checksum / Hash Utility**  
  Built-in MD5, SHA256, etc., for files.  
  Example:

  ```
  npx parserblade hash file.json --algo sha256
  ```

- **Webhook Output for CLI**  
  After parsing, send the result directly to a webhook.  
  Example:

  ```
  npx parserblade parse data.json --to yaml --webhook https://example.com/receiver
  ```

- **Smart CSV Parsing with Type Inference**  
  Automatically detect numeric, boolean, or null types when parsing CSV.

- **Error Recovery Mode**  
  Allow parsing even with broken or malformed files by skipping invalid rows/blocks with warnings.

- **Schema-Aware Validation (JSON Schema / OpenAPI)**  
  Validate JSON or YAML against a JSON Schema or OpenAPI definition.

- **Schema Generation from Data**  
  Automatically generate a JSON Schema or OpenAPI spec from JSON/YAML input.

- **Chained Operations**  
  Allow chaining multiple operations in a single CLI call.  
  Example:

  ```
  npx parserblade parse data.yaml --to json --minify --hash sha256
  ```

- **Server/Daemon Mode**  
  Run as a local server to expose parsing capabilities via HTTP REST API.  
  Example:

  ```
  npx parserblade serve --port 4000
  ```

- **Built-in JSON/YAML Formatter / Linter**  
  Quickly lint and format files to standard styling.

- **Native Git Hooks Integration**  
  Install as a Git hook to auto-validate or auto-format files before commits.

- **CLI Interactive Mode**  
  Launch an interactive CLI wizard when no arguments are passed.

- **Compression Support**  
  Handle .zip, .tar.gz, .gz files directly in parsing/conversion.

- **Built-in Sample Data Generator**  
  Generate fake JSON, CSV, or YAML data for testing.  
  Example:

  ```
  npx parserblade generate --type json --count 10
  ```

- **Embedded Mode (No Install)**  
  Offer a CDN-distributable version (UMD) for browser usage without Node.

---

## ✅ Skipped (Already Exists / Not Planned)

- ✅ **Streaming API** — ✔️ Already supported.
- ✅ **Error reporting with context** — ✔️ Already supported.
- ✅ **TypeScript native support** — ✔️ Already supported.
- ❌ **WASM Build** — Skipped.
- ❌ **Plugin system** — Skipped.
- ❌ **Remote File Output** — Skipped.
- ❌ **Versioned File Backups** — Skipped.
- ❌ **Error Reporting to External Services** — Skipped.
