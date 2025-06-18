import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";

const CLI_PATH = resolve(__dirname, "../../../dist/cli/index.js");
const TEMP_DIR = resolve(__dirname, "../../../temp-test");

// Helper function to run CLI command
async function runCLI(
  args: string[]
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

    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

describe("CLI validate command", () => {
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

  describe("JSON Schema validation", () => {
    it("validates valid data against JSON Schema", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      const validData = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          email: { type: "string", format: "email" },
        },
        required: ["name", "age"],
      };

      writeFileSync(inputFile, JSON.stringify(validData));
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("✓ Validation successful");
    });

    it("fails validation for invalid data against JSON Schema", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      const invalidData = {
        name: "John Doe",
        // missing required age field
      };

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
      };

      writeFileSync(inputFile, JSON.stringify(invalidData));
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("✗ Validation failed");
      expect(result.stderr).toContain("Validation errors:");
    });
  });

  describe("Zod validation", () => {
    it("validates valid data against Zod schema", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.ts");

      const validData = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const zodSchema = `
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

export default schema;
      `;

      writeFileSync(inputFile, JSON.stringify(validData));
      writeFileSync(schemaFile, zodSchema);

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "zod",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("✓ Validation successful");
    });

    it("fails validation for invalid data against Zod schema", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.ts");

      const invalidData = {
        name: "John Doe",
        age: "not a number", // invalid type
        email: "invalid-email", // invalid email format
      };

      const zodSchema = `
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

export default schema;
      `;

      writeFileSync(inputFile, JSON.stringify(invalidData));
      writeFileSync(schemaFile, zodSchema);

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "zod",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("✗ Validation failed");
      expect(result.stderr).toContain("Validation errors:");
    });
  });

  describe("Joi validation", () => {
    it("validates valid data against Joi schema", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.js");

      const validData = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const joiSchema = `
const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().required(),
  email: Joi.string().email(),
});

module.exports = schema;
      `;

      writeFileSync(inputFile, JSON.stringify(validData));
      writeFileSync(schemaFile, joiSchema);

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "joi",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("✓ Validation successful");
    });

    it("fails validation for invalid data against Joi schema", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.js");

      const invalidData = {
        name: "John Doe",
        // missing required age field
        email: "invalid-email", // invalid email format
      };

      const joiSchema = `
const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().required(),
  email: Joi.string().email(),
});

module.exports = schema;
      `;

      writeFileSync(inputFile, JSON.stringify(invalidData));
      writeFileSync(schemaFile, joiSchema);

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "joi",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("✗ Validation failed");
      expect(result.stderr).toContain("Validation errors:");
    });
  });

  describe("format detection", () => {
    it("auto-detects JSON format from file extension", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      const validData = { name: "test", value: 42 };
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
        },
        required: ["name"],
      };

      writeFileSync(inputFile, JSON.stringify(validData));
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("✓ Validation successful");
    });

    it("auto-detects YAML format from file extension", async () => {
      const inputFile = join(TEMP_DIR, "input.yaml");
      const schemaFile = join(TEMP_DIR, "schema.json");

      const validData = "name: test\nvalue: 42";
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
        },
        required: ["name"],
      };

      writeFileSync(inputFile, validData);
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("✓ Validation successful");
    });

    it("respects --format option", async () => {
      const inputFile = join(TEMP_DIR, "input.txt"); // Non-standard extension
      const schemaFile = join(TEMP_DIR, "schema.json");

      const validData = '{"name": "test", "value": 42}';
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
        },
        required: ["name"],
      };

      writeFileSync(inputFile, validData);
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--format",
        "json",
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("✓ Validation successful");
    });
  });

  describe("error handling", () => {
    it("handles missing input file", async () => {
      const schemaFile = join(TEMP_DIR, "schema.json");
      const schema = { type: "object" };
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI([
        "validate",
        "nonexistent.json",
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });

    it("handles missing schema file", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      writeFileSync(inputFile, '{"test": true}');

      const result = await runCLI([
        "validate",
        inputFile,
        "nonexistent-schema.json",
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });

    it("handles unsupported input format", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      writeFileSync(inputFile, '{"test": true}');
      writeFileSync(schemaFile, '{"type": "object"}');

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--format",
        "unknown",
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Unsupported input format");
    });

    it("handles unsupported schema type", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      writeFileSync(inputFile, '{"test": true}');
      writeFileSync(schemaFile, '{"type": "object"}');

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "unknown",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Unsupported schema type");
    });

    it("handles invalid JSON in input file", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      writeFileSync(inputFile, '{"invalid": }');
      writeFileSync(schemaFile, '{"type": "object"}');

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });

    it("handles invalid JSON Schema", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      writeFileSync(inputFile, '{"test": true}');
      writeFileSync(schemaFile, '{"invalid": }'); // Invalid JSON

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "json-schema",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
    });
  });

  describe("validation options", () => {
    it("handles --throw option", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.json");

      const invalidData = {
        name: "John Doe",
        // missing required age field
      };

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
      };

      writeFileSync(inputFile, JSON.stringify(invalidData));
      writeFileSync(schemaFile, JSON.stringify(schema));

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        "--type",
        "json-schema",
        "--throw",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("✗ Validation failed");
    });

    it("defaults to zod schema type when not specified", async () => {
      const inputFile = join(TEMP_DIR, "input.json");
      const schemaFile = join(TEMP_DIR, "schema.ts");

      const validData = {
        name: "John Doe",
        age: 30,
      };

      const zodSchema = `
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

export default schema;
      `;

      writeFileSync(inputFile, JSON.stringify(validData));
      writeFileSync(schemaFile, zodSchema);

      const result = await runCLI([
        "validate",
        inputFile,
        schemaFile,
        // --type defaults to "zod"
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("✓ Validation successful");
    });
  });
});
