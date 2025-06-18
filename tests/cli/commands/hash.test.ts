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

describe("CLI hash command", () => {
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

  describe("basic hashing", () => {
    it("hashes file with default SHA256", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = await runCLI(["hash", testFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain(testFile);
      expect(result.stdout).toMatch(/[a-f0-9]{64}/); // SHA256 hex pattern
    });

    it("hashes stdin with default SHA256", async () => {
      const content = "Hello, World!";
      const result = await runCLI(["hash"], content);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain("stdin");
      expect(result.stdout).toMatch(/[a-f0-9]{64}/); // SHA256 hex pattern
    });

    it("hashes stdin when file is '-'", async () => {
      const content = "Hello, World!";
      const result = await runCLI(["hash", "-"], content);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain("stdin");
      expect(result.stdout).toMatch(/[a-f0-9]{64}/); // SHA256 hex pattern
    });
  });

  describe("algorithm options", () => {
    it("hashes with MD5 algorithm", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = await runCLI(["hash", testFile, "--algo", "md5"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MD5");
      expect(result.stdout).toMatch(/[a-f0-9]{32}/); // MD5 hex pattern
    });

    it("hashes with SHA1 algorithm", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = await runCLI(["hash", testFile, "--algo", "sha1"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("SHA1");
      expect(result.stdout).toMatch(/[a-f0-9]{40}/); // SHA1 hex pattern
    });

    it("hashes with SHA512 algorithm", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = await runCLI(["hash", testFile, "--algo", "sha512"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("SHA512");
      expect(result.stdout).toMatch(/[a-f0-9]{128}/); // SHA512 hex pattern
    });

    it("generates all algorithms when --all flag is used", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = await runCLI(["hash", testFile, "--all"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MD5");
      expect(result.stdout).toContain("SHA1");
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain("SHA512");
    });
  });

  describe("output format options", () => {
    it("outputs short format when --short flag is used", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = await runCLI(["hash", testFile, "--short"]);

      expect(result.code).toBe(0);
      // Short format should only contain the hash value
      expect(result.stdout.trim()).toMatch(/^[a-f0-9]{64}$/);
      expect(result.stdout).not.toContain("SHA256");
      expect(result.stdout).not.toContain(testFile);
    });

    it("outputs long format by default", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = await runCLI(["hash", testFile]);

      expect(result.code).toBe(0);
      // Long format should contain algorithm, hash, and filename
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain(testFile);
      expect(result.stdout).toMatch(/[a-f0-9]{64}/);
    });
  });

  describe("multiple files", () => {
    it("hashes multiple files", async () => {
      const testFile1 = join(TEMP_DIR, "test1.txt");
      const testFile2 = join(TEMP_DIR, "test2.txt");
      writeFileSync(testFile1, "Content 1");
      writeFileSync(testFile2, "Content 2");

      const result = await runCLI(["hash", testFile1, testFile2]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(testFile1);
      expect(result.stdout).toContain(testFile2);
      // Should have two different hashes
      const lines = result.stdout.trim().split("\n");
      expect(lines.length).toBe(2);
    });

    it("hashes multiple files with all algorithms", async () => {
      const testFile1 = join(TEMP_DIR, "test1.txt");
      const testFile2 = join(TEMP_DIR, "test2.txt");
      writeFileSync(testFile1, "Content 1");
      writeFileSync(testFile2, "Content 2");

      const result = await runCLI(["hash", testFile1, testFile2, "--all"]);

      expect(result.code).toBe(0);
      // Should have multiple algorithms for each file
      expect(result.stdout).toContain("MD5");
      expect(result.stdout).toContain("SHA1");
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain("SHA512");
      expect(result.stdout).toContain(testFile1);
      expect(result.stdout).toContain(testFile2);
    });
  });

  describe("hash verification", () => {
    it("verifies correct hash", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      // First, get the hash
      const hashResult = await runCLI(["hash", testFile, "--short"]);
      const expectedHash = hashResult.stdout.trim();

      // Then verify it
      const verifyResult = await runCLI([
        "hash",
        testFile,
        "--verify",
        expectedHash,
      ]);

      expect(verifyResult.code).toBe(0);
      expect(verifyResult.stdout).toContain("✓ Hash verification successful");
    });

    it("fails verification for incorrect hash", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const incorrectHash = "0123456789abcdef".repeat(4); // 64 char hex

      const result = await runCLI([
        "hash",
        testFile,
        "--verify",
        incorrectHash,
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("✗ Hash verification failed");
      expect(result.stderr).toContain("Expected:");
      expect(result.stderr).toContain("Actual:");
    });

    it("verifies hash from stdin", async () => {
      const content = "Hello, World!";

      // First, get the hash
      const hashResult = await runCLI(["hash", "--short"], content);
      const expectedHash = hashResult.stdout.trim();

      // Then verify it
      const verifyResult = await runCLI(
        ["hash", "--verify", expectedHash],
        content
      );

      expect(verifyResult.code).toBe(0);
      expect(verifyResult.stdout).toContain("✓ Hash verification successful");
    });
  });

  describe("error handling", () => {
    it("handles missing file", async () => {
      const result = await runCLI(["hash", "nonexistent.txt"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error:");
      expect(result.stderr).toContain("not found");
    });

    it("handles unsupported algorithm", async () => {
      const testFile = join(TEMP_DIR, "test.txt");
      writeFileSync(testFile, "content");

      const result = await runCLI(["hash", testFile, "--algo", "unknown"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Unsupported algorithm");
      expect(result.stderr).toContain("unknown");
      expect(result.stderr).toContain("Supported algorithms:");
    });

    it("handles empty stdin gracefully", async () => {
      const result = await runCLI(["hash"], "");

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toMatch(/[a-f0-9]{64}/);
    });
  });

  describe("stdin handling", () => {
    it("processes stdin data correctly", async () => {
      const content = "Test data for hashing";
      const result = await runCLI(["hash"], content);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain("stdin");
      expect(result.stdout).toMatch(/[a-f0-9]{64}/);
    });

    it("processes stdin with different algorithms", async () => {
      const content = "Test data";
      const result = await runCLI(["hash", "--algo", "md5"], content);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MD5");
      expect(result.stdout).toMatch(/[a-f0-9]{32}/);
    });

    it("processes stdin with all algorithms", async () => {
      const content = "Test data";
      const result = await runCLI(["hash", "--all"], content);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("MD5");
      expect(result.stdout).toContain("SHA1");
      expect(result.stdout).toContain("SHA256");
      expect(result.stdout).toContain("SHA512");
    });
  });

  describe("consistency", () => {
    it("generates same hash for same content", async () => {
      const content = "Consistent content";

      const result1 = await runCLI(["hash", "--short"], content);
      const result2 = await runCLI(["hash", "--short"], content);

      expect(result1.code).toBe(0);
      expect(result2.code).toBe(0);
      expect(result1.stdout.trim()).toBe(result2.stdout.trim());
    });

    it("generates different hashes for different content", async () => {
      const content1 = "Content 1";
      const content2 = "Content 2";

      const result1 = await runCLI(["hash", "--short"], content1);
      const result2 = await runCLI(["hash", "--short"], content2);

      expect(result1.code).toBe(0);
      expect(result2.code).toBe(0);
      expect(result1.stdout.trim()).not.toBe(result2.stdout.trim());
    });
  });
});
