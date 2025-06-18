import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";

const CLI_PATH = resolve(__dirname, "../../dist/cli/index.js");
const TEMP_DIR = resolve(__dirname, "../../temp-test");

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

describe("CLI Integration Tests", () => {
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

  describe("Parse + Query workflow", () => {
    it("converts JSON to YAML then queries the result", async () => {
      const originalData = {
        users: [
          { name: "John", age: 30, role: "admin" },
          { name: "Jane", age: 25, role: "user" },
        ],
        metadata: { total: 2, version: "1.0" },
      };

      const inputFile = join(TEMP_DIR, "input.json");
      const outputFile = join(TEMP_DIR, "output.yaml");

      writeFileSync(inputFile, JSON.stringify(originalData, null, 2));

      // Step 1: Convert JSON to YAML
      const parseResult = await runCLI([
        "parse",
        inputFile,
        "--to",
        "yaml",
        "--output",
        outputFile,
      ]);

      expect(parseResult.code).toBe(0);
      expect(parseResult.stderr).toContain("✓ Converted");

      // Step 2: Query the YAML file
      const queryResult = await runCLI([
        "query",
        outputFile,
        "$.users[*].name",
      ]);

      expect(queryResult.code).toBe(0);
      const queryOutput = JSON.parse(queryResult.stdout);
      expect(queryOutput).toEqual(["John", "Jane"]);
    });

    it("parses CSV and queries with filters", async () => {
      const csvData = `name,age,department,salary
John Doe,30,Engineering,75000
Jane Smith,25,Marketing,60000
Bob Johnson,35,Engineering,80000
Alice Brown,28,HR,55000`;

      const inputFile = join(TEMP_DIR, "employees.csv");
      writeFileSync(inputFile, csvData);

      // Query for engineering employees' names
      const result = await runCLI([
        "query",
        inputFile,
        "$.[?(@.department === 'Engineering')].name",
      ]);

      expect(result.code).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output).toEqual(["John Doe", "Bob Johnson"]);
    });
  });

  describe("Parse + Hash workflow", () => {
    it("converts format and verifies data integrity with hash", async () => {
      const originalData = { version: "1.0", data: [1, 2, 3, 4, 5] };
      const inputFile = join(TEMP_DIR, "data.json");
      const outputFile = join(TEMP_DIR, "data.yaml");

      writeFileSync(inputFile, JSON.stringify(originalData));

      // Step 1: Get hash of original file
      const originalHashResult = await runCLI(["hash", inputFile, "--short"]);
      expect(originalHashResult.code).toBe(0);
      const originalHash = originalHashResult.stdout.trim();

      // Step 2: Convert to YAML
      const parseResult = await runCLI([
        "parse",
        inputFile,
        "--to",
        "yaml",
        "--output",
        outputFile,
      ]);
      expect(parseResult.code).toBe(0);

      // Step 3: Convert back to JSON
      const backToJsonFile = join(TEMP_DIR, "back-to-json.json");
      const backConvertResult = await runCLI([
        "parse",
        outputFile,
        "--to",
        "json",
        "--output",
        backToJsonFile,
      ]);
      expect(backConvertResult.code).toBe(0);

      // Step 4: Hash the converted-back file
      const newHashResult = await runCLI(["hash", backToJsonFile, "--short"]);
      expect(newHashResult.code).toBe(0);
      const newHash = newHashResult.stdout.trim();

      // Hashes should be identical (data integrity preserved)
      expect(newHash).toBe(originalHash);
    });

    it("compares hashes of different format representations", async () => {
      const data = { name: "test", values: [1, 2, 3] };
      const jsonFile = join(TEMP_DIR, "data.json");
      const yamlFile = join(TEMP_DIR, "data.yaml");

      // Save as JSON
      writeFileSync(jsonFile, JSON.stringify(data));

      // Convert to YAML
      await runCLI(["parse", jsonFile, "--to", "yaml", "--output", yamlFile]);

      // Hash both files
      const jsonHashResult = await runCLI(["hash", jsonFile, "--short"]);
      const yamlHashResult = await runCLI(["hash", yamlFile, "--short"]);

      expect(jsonHashResult.code).toBe(0);
      expect(yamlHashResult.code).toBe(0);

      // Hashes should be different (different file formats)
      expect(jsonHashResult.stdout.trim()).not.toBe(
        yamlHashResult.stdout.trim()
      );
    });
  });

  describe("Parse + Validate workflow", () => {
    it("converts data and validates against schema", async () => {
      const yamlData = `name: John Doe
age: 30
email: john@example.com
isActive: true`;

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number", minimum: 0 },
          email: { type: "string", format: "email" },
          isActive: { type: "boolean" },
        },
        required: ["name", "age", "email"],
      };

      const yamlFile = join(TEMP_DIR, "user.yaml");
      const jsonFile = join(TEMP_DIR, "user.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      writeFileSync(yamlFile, yamlData);
      writeFileSync(schemaFile, JSON.stringify(schema, null, 2));

      // Step 1: Convert YAML to JSON
      const parseResult = await runCLI([
        "parse",
        yamlFile,
        "--to",
        "json",
        "--output",
        jsonFile,
      ]);
      expect(parseResult.code).toBe(0);

      // Step 2: Validate converted JSON against schema
      const validateResult = await runCLI([
        "validate",
        jsonFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(validateResult.code).toBe(0);
      expect(validateResult.stdout).toContain("✓ Validation successful");
    });

    it("fails validation after conversion when data is invalid", async () => {
      const invalidUserData = {
        name: "John Doe",
        age: -5, // Invalid: negative age
        email: "not-an-email", // Invalid: not an email format
      };

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number", minimum: 0 },
          email: { type: "string", format: "email" },
        },
        required: ["name", "age", "email"],
      };

      const jsonFile = join(TEMP_DIR, "invalid-user.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      writeFileSync(jsonFile, JSON.stringify(invalidUserData));
      writeFileSync(schemaFile, JSON.stringify(schema));

      // Validation should fail
      const validateResult = await runCLI([
        "validate",
        jsonFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(validateResult.code).toBe(1);
      expect(validateResult.stderr).toContain("✗ Validation failed");
      expect(validateResult.stderr).toContain("Validation errors:");
    });
  });

  describe("Complex multi-command workflows", () => {
    it("processes data through multiple transformations", async () => {
      // Start with CSV data
      const csvData = `id,name,score,category
1,Alice,95,A
2,Bob,87,B
3,Charlie,92,A
4,Diana,78,B`;

      const csvFile = join(TEMP_DIR, "scores.csv");
      const jsonFile = join(TEMP_DIR, "scores.json");
      const yamlFile = join(TEMP_DIR, "scores.yaml");

      writeFileSync(csvFile, csvData);

      // Step 1: Convert CSV to JSON
      const csvToJsonResult = await runCLI([
        "parse",
        csvFile,
        "--to",
        "json",
        "--output",
        jsonFile,
      ]);
      expect(csvToJsonResult.code).toBe(0);

      // Step 2: Query for category A students
      const queryResult = await runCLI([
        "query",
        jsonFile,
        "$.[?(@.category === 'A')].name",
      ]);
      expect(queryResult.code).toBe(0);
      const categoryAStudents = JSON.parse(queryResult.stdout);
      expect(categoryAStudents).toEqual(["Alice", "Charlie"]);

      // Step 3: Convert to YAML
      const jsonToYamlResult = await runCLI([
        "parse",
        jsonFile,
        "--to",
        "yaml",
        "--output",
        yamlFile,
      ]);
      expect(jsonToYamlResult.code).toBe(0);

      // Step 4: Query the YAML version for high scores
      const highScoreQuery = await runCLI([
        "query",
        yamlFile,
        "$.[?(@.score > 90)].name",
      ]);
      expect(highScoreQuery.code).toBe(0);
      const highScoreStudents = JSON.parse(highScoreQuery.stdout);
      expect(highScoreStudents).toEqual(["Alice", "Charlie"]);

      // Step 5: Generate hash for final file
      const hashResult = await runCLI(["hash", yamlFile]);
      expect(hashResult.code).toBe(0);
      expect(hashResult.stdout).toContain("SHA256");
      expect(hashResult.stdout).toContain("scores.yaml");
    });

    it("handles edge cases in multi-command workflow", async () => {
      // Empty array data
      const emptyData = "[]";
      const inputFile = join(TEMP_DIR, "empty.json");
      const outputFile = join(TEMP_DIR, "empty.yaml");

      writeFileSync(inputFile, emptyData);

      // Convert empty JSON to YAML
      const parseResult = await runCLI([
        "parse",
        inputFile,
        "--to",
        "yaml",
        "--output",
        outputFile,
      ]);
      expect(parseResult.code).toBe(0);

      // Query empty array
      const queryResult = await runCLI(["query", outputFile, "$[*]"]);
      expect(queryResult.code).toBe(0);
      expect(queryResult.stdout).toContain("No results found");

      // Hash empty file
      const hashResult = await runCLI(["hash", outputFile, "--short"]);
      expect(hashResult.code).toBe(0);
      expect(hashResult.stdout.trim()).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("Error handling in workflows", () => {
    it("handles conversion errors gracefully", async () => {
      const invalidJsonFile = join(TEMP_DIR, "invalid.json");
      writeFileSync(invalidJsonFile, '{"invalid": }');

      // Try to convert invalid JSON
      const result = await runCLI(["parse", invalidJsonFile, "--to", "yaml"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });

    it("handles validation errors in workflow", async () => {
      const validJsonFile = join(TEMP_DIR, "valid.json");
      const invalidSchemaFile = join(TEMP_DIR, "invalid-schema.json");

      writeFileSync(validJsonFile, '{"name": "test"}');
      writeFileSync(invalidSchemaFile, '{"invalid": }'); // Invalid JSON schema

      const result = await runCLI([
        "validate",
        validJsonFile,
        invalidSchemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });
  });

  describe("Performance and reliability", () => {
    it("handles reasonably large datasets", async () => {
      // Generate a moderately large JSON array
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        score: Math.floor(Math.random() * 100),
        active: i % 2 === 0,
      }));

      const largeJsonFile = join(TEMP_DIR, "large.json");
      writeFileSync(largeJsonFile, JSON.stringify(largeData));

      // Convert to YAML
      const parseResult = await runCLI([
        "parse",
        largeJsonFile,
        "--to",
        "yaml",
        "--output",
        join(TEMP_DIR, "large.yaml"),
      ]);
      expect(parseResult.code).toBe(0);

      // Query active users
      const queryResult = await runCLI([
        "query",
        largeJsonFile,
        "$.[?(@.active === true)]",
        "--count",
      ]);
      expect(queryResult.code).toBe(0);
      expect(Number.parseInt(queryResult.stdout.trim())).toBe(500);

      // Hash the file
      const hashResult = await runCLI(["hash", largeJsonFile]);
      expect(hashResult.code).toBe(0);
      expect(hashResult.stdout).toContain("SHA256");
    });

    it("maintains data consistency across multiple conversions", async () => {
      const originalData = {
        numbers: [1, 2, 3.14, -5],
        strings: ["hello", "world", "with spaces", ""],
        booleans: [true, false],
        nullValue: null,
        nested: {
          deep: {
            value: "test",
          },
        },
      };

      const files = {
        json1: join(TEMP_DIR, "original.json"),
        yaml: join(TEMP_DIR, "converted.yaml"),
        json2: join(TEMP_DIR, "back-to-json.json"),
      };

      // Start with JSON
      writeFileSync(files.json1, JSON.stringify(originalData));

      // Convert JSON -> YAML -> JSON
      await runCLI([
        "parse",
        files.json1,
        "--to",
        "yaml",
        "--output",
        files.yaml,
      ]);

      await runCLI([
        "parse",
        files.yaml,
        "--to",
        "json",
        "--output",
        files.json2,
      ]);

      // Verify data consistency
      const finalData = JSON.parse(readFileSync(files.json2, "utf8"));
      expect(finalData).toEqual(originalData);

      // Query should return same results from both files
      const query1 = await runCLI(["query", files.json1, "$.numbers[*]"]);
      const query2 = await runCLI(["query", files.json2, "$.numbers[*]"]);

      expect(query1.stdout).toBe(query2.stdout);
    });
  });
});
