import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";

const CLI_PATH = resolve(__dirname, "../../../dist/cli/index.js");
const TEMP_DIR = resolve(__dirname, "../../../temp-test");

// Helper function to run CLI command
async function runCLI(
  args: string[],
  stdin?: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn("node", [CLI_PATH, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

describe("CLI parse command", () => {
  beforeEach(() => {
    // Create temp directory for test files
    mkdirSync(TEMP_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("format conversion", () => {
    it("converts JSON to YAML", async () => {
      const jsonData = '{"name": "test", "value": 42}';
      const result = await runCLI(["parse", "--to", "yaml"], jsonData);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("name: test");
      expect(result.stdout).toContain("value: 42");
    });

    it("converts YAML to JSON", async () => {
      const yamlData = "name: test\nvalue: 42";
      const result = await runCLI(["parse", "--to", "json"], yamlData);

      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toEqual({ name: "test", value: 42 });
    });

    it("converts CSV to JSON", async () => {
      const csvData = "name,age\nJohn,30\nJane,25";
      const result = await runCLI(["parse", "--to", "json"], csvData);

      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toEqual([
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ]);
    });

    it("converts JSON to XML", async () => {
      const jsonData = '{"root": {"item": "test"}}';
      const result = await runCLI(["parse", "--to", "xml"], jsonData);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("<root>");
      expect(result.stdout).toContain("<item>test</item>");
    });
  });

  describe("file input/output", () => {
    it("reads from file and outputs to stdout", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const data = '{"test": true}';
      writeFileSync(inputFile, data);

      const result = await runCLI(["parse", inputFile, "--to", "yaml"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("test: true");
    });

    it("reads from file and outputs to file", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const outputFile = join(TEMP_DIR, "output.yaml");
      const data = '{"test": true}';
      writeFileSync(inputFile, data);

      const result = await runCLI([
        "parse",
        inputFile,
        "--to",
        "yaml",
        "--output",
        outputFile,
      ]);

      expect(result.code).toBe(0);
      expect(result.stderr).toContain("✓ Converted");

      const outputContent = readFileSync(outputFile, "utf8");
      expect(outputContent).toContain("test: true");
    });

    it("auto-detects format from file extension", async () => {
      const inputFile = join(TEMP_DIR, "input.yaml");
      const data = "name: test\nvalue: 42";
      writeFileSync(inputFile, data);

      const result = await runCLI(["parse", inputFile, "--to", "json"]);

      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toEqual({ name: "test", value: 42 });
    });
  });

  describe("format options", () => {
    it("pretty prints JSON output", async () => {
      const data = '{"name": "test", "value": 42}';
      const result = await runCLI(["parse", "--to", "json", "--pretty"], data);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('{\n  "name": "test"');
      expect(result.stdout).toContain('  "value": 42\n}');
    });

    it("minifies JSON output", async () => {
      const data = '{\n  "name": "test",\n  "value": 42\n}';
      const result = await runCLI(["parse", "--to", "json", "--minify"], data);

      expect(result.code).toBe(0);
      expect(result.stdout.trim()).toBe('{"name":"test","value":42}');
    });

    it("pretty prints YAML output", async () => {
      const data = '{"nested": {"key": "value"}}';
      const result = await runCLI(["parse", "--to", "yaml", "--pretty"], data);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("nested:\n  key: value");
    });
  });

  describe("format specification", () => {
    it("respects --from option", async () => {
      const data = "name,age\nJohn,30"; // CSV data
      const result = await runCLI(
        ["parse", "--from", "csv", "--to", "json"],
        data
      );

      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toEqual([{ name: "John", age: "30" }]);
    });

    it("detects format from output file extension", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const outputFile = join(TEMP_DIR, "output.yaml");
      const data = '{"test": true}';
      writeFileSync(inputFile, data);

      const result = await runCLI(["parse", inputFile, "--output", outputFile]);

      expect(result.code).toBe(0);
      const outputContent = readFileSync(outputFile, "utf8");
      expect(outputContent).toContain("test: true");
    });
  });

  describe("stdin handling", () => {
    it("reads from stdin when no file specified", async () => {
      const data = '{"test": "stdin"}';
      const result = await runCLI(["parse", "--to", "yaml"], data);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("test: stdin");
    });

    it("reads from stdin when file is '-'", async () => {
      const data = '{"test": "dash"}';
      const result = await runCLI(["parse", "-", "--to", "yaml"], data);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("test: dash");
    });
  });

  describe("error handling", () => {
    it("handles invalid JSON", async () => {
      const data = '{"invalid": }';
      const result = await runCLI(["parse", "--from", "json"], data);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });

    it("handles unsupported input format", async () => {
      const result = await runCLI(["parse", "--from", "unknown"], "data");

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Unsupported input format");
      expect(result.stderr).toContain("unknown");
    });

    it("handles unsupported output format", async () => {
      const result = await runCLI(["parse", "--to", "unknown"], "{}");

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Unsupported output format");
      expect(result.stderr).toContain("unknown");
    });

    it("handles missing input file", async () => {
      const result = await runCLI(["parse", "nonexistent.json"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });
  });

  describe("validation with schema", () => {
    it("validates with JSON Schema", async () => {
      const userData = JSON.stringify({
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      });

      const schemaFile = join(TEMP_DIR, "schema.json");
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          email: { type: "string", format: "email" },
        },
        required: ["name", "age"],
      };
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI(
        [
          "parse",
          "--to",
          "json",
          "--schema",
          schemaFile,
          "--schema-type",
          "json-schema",
        ],
        userData
      );

      expect(result.code).toBe(0);
      expect(result.stderr).toContain("validated");
    });

    it("fails validation with invalid data", async () => {
      const userData = JSON.stringify({
        name: "John Doe",
        // missing required age field
      });

      const schemaFile = join(TEMP_DIR, "schema.json");
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
      };
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI(
        [
          "parse",
          "--to",
          "json",
          "--schema",
          schemaFile,
          "--schema-type",
          "json-schema",
        ],
        userData
      );

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Validation failed");
    });
  });
});
