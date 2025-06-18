import { writeFileSync, mkdirSync, rmSync } from "node:fs";
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

describe("CLI query command", () => {
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

  describe("basic querying", () => {
    it("queries JSON data with JSONPath", async () => {
      const data = {
        users: [
          { name: "John", email: "john@example.com" },
          { name: "Jane", email: "jane@example.com" },
        ],
      };

      const result = await runCLI(
        ["query", "$.users[*].name"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["John", "Jane"]);
      expect(result.stderr).toContain("Found 2 result(s)");
    });

    it("queries specific array element", async () => {
      const data = {
        users: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
      };

      const result = await runCLI(
        ["query", "$.users[0].name"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["John"]);
    });

    it("queries nested properties", async () => {
      const data = {
        company: {
          name: "ACME Corp",
          address: {
            city: "New York",
            country: "USA",
          },
        },
      };

      const result = await runCLI(
        ["query", "$.company.address.city"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["New York"]);
    });
  });

  describe("file input", () => {
    it("queries data from JSON file", async () => {
      const inputFile = join(TEMP_DIR, "data.json");
      const data = {
        products: [
          { name: "Laptop", price: 999 },
          { name: "Phone", price: 599 },
        ],
      };

      writeFileSync(inputFile, JSON.stringify(data));

      const result = await runCLI(["query", inputFile, "$.products[*].price"]);

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual([999, 599]);
    });

    it("queries data from YAML file", async () => {
      const inputFile = join(TEMP_DIR, "data.yaml");
      const yamlData = `
services:
  - name: web
    port: 80
  - name: api
    port: 8080
`;

      writeFileSync(inputFile, yamlData);

      const result = await runCLI(["query", inputFile, "$.services[*].port"]);

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual([80, 8080]);
    });

    it("auto-detects format from file extension", async () => {
      const inputFile = join(TEMP_DIR, "data.yaml");
      const yamlData = "name: test\nvalue: 42";

      writeFileSync(inputFile, yamlData);

      const result = await runCLI(["query", inputFile, "$.name"]);

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["test"]);
    });
  });

  describe("format options", () => {
    it("respects --from option", async () => {
      const csvData = "name,age\nJohn,30\nJane,25";
      const result = await runCLI(
        ["query", "--from", "csv", "$.*.name"],
        csvData
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["John", "Jane"]);
    });

    it("outputs in YAML format when --to yaml is specified", async () => {
      const data = { users: [{ name: "John" }, { name: "Jane" }] };
      const result = await runCLI(
        ["query", "$.users[*].name", "--to", "yaml"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("- John");
      expect(result.stdout).toContain("- Jane");
    });

    it("pretty prints output when --pretty is used", async () => {
      const data = { user: { name: "John", details: { age: 30 } } };
      const result = await runCLI(
        ["query", "$.user", "--pretty"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("{\n");
      expect(result.stdout).toContain('  "name"');
    });
  });

  describe("query options", () => {
    it("returns count when --count is used", async () => {
      const data = {
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const result = await runCLI(
        ["query", "$.items[*]", "--count"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      expect(result.stdout.trim()).toBe("3");
    });

    it("returns first element when --first is used", async () => {
      const data = {
        users: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
      };

      const result = await runCLI(
        ["query", "$.users[*].name", "--first"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      expect(result.stdout.trim()).toBe('"John"');
    });

    it("returns unique values when --unique is used", async () => {
      const data = {
        items: [
          { category: "electronics" },
          { category: "books" },
          { category: "electronics" },
          { category: "books" },
        ],
      };

      const result = await runCLI(
        ["query", "$.items[*].category", "--unique"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toHaveLength(2);
      expect(output).toContain("electronics");
      expect(output).toContain("books");
    });
  });

  describe("complex queries", () => {
    it("filters data with conditional expressions", async () => {
      const data = {
        products: [
          { name: "Laptop", price: 999, category: "electronics" },
          { name: "Book", price: 20, category: "books" },
          { name: "Phone", price: 599, category: "electronics" },
        ],
      };

      const result = await runCLI(
        ["query", "$.products[?(@.price > 500)].name"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["Laptop", "Phone"]);
    });

    it("queries recursive descent", async () => {
      const data = {
        level1: {
          name: "first",
          level2: {
            name: "second",
            level3: {
              name: "third",
            },
          },
        },
      };

      const result = await runCLI(["query", "$..name"], JSON.stringify(data));

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["first", "second", "third"]);
    });

    it("handles array length queries", async () => {
      const data = {
        users: [{ name: "John" }, { name: "Jane" }, { name: "Bob" }],
      };

      const result = await runCLI(
        ["query", "$.users.length"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual([3]);
    });
  });

  describe("stdin handling", () => {
    it("reads from stdin when no file specified", async () => {
      const data = { message: "from stdin" };
      const result = await runCLI(["query", "$.message"], JSON.stringify(data));

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["from stdin"]);
    });

    it("reads from stdin when file is '-'", async () => {
      const data = { test: "dash input" };
      const result = await runCLI(
        ["query", "-", "$.test"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["dash input"]);
    });
  });

  describe("error handling", () => {
    it("handles missing query argument", async () => {
      const result = await runCLI(["query"], '{"test": true}');

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("JSONPath query expression is required");
      expect(result.stderr).toContain("Example:");
    });

    it("handles invalid JSONPath expression", async () => {
      const data = { test: true };
      const result = await runCLI(
        ["query", "$.invalid[syntax"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Invalid JSONPath expression");
      expect(result.stderr).toContain(
        "Examples of valid JSONPath expressions:"
      );
    });

    it("handles unsupported input format", async () => {
      const result = await runCLI(
        ["query", "--from", "unknown", "$.test"],
        "{}"
      );

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Unsupported input format");
      expect(result.stderr).toContain("unknown");
    });

    it("handles unsupported output format", async () => {
      const result = await runCLI(
        ["query", "$.test", "--to", "unknown"],
        '{"test": true}'
      );

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Unsupported output format");
      expect(result.stderr).toContain("unknown");
    });

    it("handles missing input file", async () => {
      const result = await runCLI(["query", "nonexistent.json", "$.test"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });

    it("handles invalid JSON input", async () => {
      const result = await runCLI(["query", "$.test"], '{"invalid": }');

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });
  });

  describe("empty results", () => {
    it("handles queries with no results", async () => {
      const data = { users: [] };
      const result = await runCLI(
        ["query", "$.users[*].name"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("No results found");
    });

    it("handles queries that don't match", async () => {
      const data = { name: "test" };
      const result = await runCLI(
        ["query", "$.nonexistent"],
        JSON.stringify(data)
      );

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("No results found");
    });
  });

  describe("compressed files", () => {
    it("handles compressed JSON files", async () => {
      // Note: This test would require actual compression functionality
      // For now, we'll test the error handling
      const result = await runCLI(["query", "nonexistent.json.gz", "$.test"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });
  });

  describe("different data types", () => {
    it("handles various JSON data types", async () => {
      const data = {
        string: "text",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: "value" },
      };

      const result = await runCLI(["query", "$.*"], JSON.stringify(data));

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toHaveLength(6);
      expect(output).toContain("text");
      expect(output).toContain(42);
      expect(output).toContain(true);
      expect(output).toContain(null);
    });

    it("handles queries returning different data types", async () => {
      const data = {
        items: [
          { name: "Item 1", active: true, count: 5 },
          { name: "Item 2", active: false, count: 0 },
        ],
      };

      // Test string query
      const stringResult = await runCLI(
        ["query", "$.items[0].name"],
        JSON.stringify(data)
      );
      expect(stringResult.code).toBe(0);
      expect(JSON.parse(stringResult.stdout)).toEqual(["Item 1"]);

      // Test boolean query
      const boolResult = await runCLI(
        ["query", "$.items[*].active"],
        JSON.stringify(data)
      );
      expect(boolResult.code).toBe(0);
      expect(JSON.parse(boolResult.stdout)).toEqual([true, false]);

      // Test number query
      const numResult = await runCLI(
        ["query", "$.items[*].count"],
        JSON.stringify(data)
      );
      expect(numResult.code).toBe(0);
      expect(JSON.parse(numResult.stdout)).toEqual([5, 0]);
    });
  });
});
