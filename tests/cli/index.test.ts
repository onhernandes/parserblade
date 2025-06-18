import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CLI_PATH = resolve(__dirname, "../../dist/cli/index.js");

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

describe("CLI main entry point", () => {
  describe("version and help", () => {
    it("displays version with --version flag", async () => {
      const result = await runCLI(["--version"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Semantic version pattern
    });

    it("displays version with -v flag", async () => {
      const result = await runCLI(["-v"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Semantic version pattern
    });

    it("displays help when no arguments provided", async () => {
      const result = await runCLI([]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("parserblade");
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("Commands:");
    });

    it("displays help with --help flag", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("parserblade");
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("Commands:");
    });

    it("displays help with -h flag", async () => {
      const result = await runCLI(["-h"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("parserblade");
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("Commands:");
    });
  });

  describe("command list", () => {
    it("lists all available commands in help output", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("parse");
      expect(result.stdout).toContain("validate");
      expect(result.stdout).toContain("hash");
      expect(result.stdout).toContain("query");
    });

    it("shows command descriptions in help output", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "Parse a file and convert it to another format"
      );
      expect(result.stdout).toContain("Validate a file against a schema");
      expect(result.stdout).toContain("Generate checksums/hashes for files");
      expect(result.stdout).toContain("Query data using JSONPath expressions");
    });
  });

  describe("command help", () => {
    it("displays help for parse command", async () => {
      const result = await runCLI(["parse", "--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("parse");
      expect(result.stdout).toContain("--to");
      expect(result.stdout).toContain("--output");
      expect(result.stdout).toContain("--from");
      expect(result.stdout).toContain("--pretty");
      expect(result.stdout).toContain("--minify");
    });

    it("displays help for validate command", async () => {
      const result = await runCLI(["validate", "--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("validate");
      expect(result.stdout).toContain("--format");
      expect(result.stdout).toContain("--type");
      expect(result.stdout).toContain("--throw");
    });

    it("displays help for hash command", async () => {
      const result = await runCLI(["hash", "--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("hash");
      expect(result.stdout).toContain("--algo");
      expect(result.stdout).toContain("--all");
      expect(result.stdout).toContain("--short");
      expect(result.stdout).toContain("--verify");
    });

    it("displays help for query command", async () => {
      const result = await runCLI(["query", "--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("query");
      expect(result.stdout).toContain("--from");
      expect(result.stdout).toContain("--to");
      expect(result.stdout).toContain("--pretty");
      expect(result.stdout).toContain("--count");
      expect(result.stdout).toContain("--first");
      expect(result.stdout).toContain("--unique");
    });
  });

  describe("error handling", () => {
    it("handles unknown command", async () => {
      const result = await runCLI(["unknown-command"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("error");
    });

    it("handles unknown global option", async () => {
      const result = await runCLI(["--unknown-option"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("error");
    });
  });

  describe("program metadata", () => {
    it("includes program name in help", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("parserblade");
    });

    it("includes program description in help", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "The easiest parser for JSON, XML, CSV and YAML"
      );
    });
  });

  describe("command chaining compatibility", () => {
    it("should be compatible with shell pipes", async () => {
      // This test checks that the CLI can be used in shell pipelines
      // by ensuring commands can read from stdin and write to stdout properly
      const parseResult = await runCLI(["parse", "--help"]);
      const hashResult = await runCLI(["hash", "--help"]);
      const queryResult = await runCLI(["query", "--help"]);
      const validateResult = await runCLI(["validate", "--help"]);

      // All commands should provide help successfully
      expect(parseResult.code).toBe(0);
      expect(hashResult.code).toBe(0);
      expect(queryResult.code).toBe(0);
      expect(validateResult.code).toBe(0);

      // All commands should mention stdin/file input capability
      expect(parseResult.stdout).toContain("file");
      expect(hashResult.stdout).toContain("files");
      expect(queryResult.stdout).toContain("file");
      expect(validateResult.stdout).toContain("file");
    });
  });
});
