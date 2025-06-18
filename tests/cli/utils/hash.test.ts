import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isValidAlgorithm,
  getSupportedAlgorithms,
  hashFile,
  hashFileMultiple,
  hashStdin,
  formatHashResult,
  type HashAlgorithm,
} from "../../../src/cli/utils/hash";

const TEMP_DIR = resolve(__dirname, "../../../temp-test");

describe("Hash utilities", () => {
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

  describe("isValidAlgorithm", () => {
    it("returns true for supported algorithms", () => {
      expect(isValidAlgorithm("md5")).toBe(true);
      expect(isValidAlgorithm("sha1")).toBe(true);
      expect(isValidAlgorithm("sha256")).toBe(true);
      expect(isValidAlgorithm("sha512")).toBe(true);
    });

    it("returns false for unsupported algorithms", () => {
      expect(isValidAlgorithm("unknown")).toBe(false);
      expect(isValidAlgorithm("sha")).toBe(false);
      expect(isValidAlgorithm("md4")).toBe(false);
      expect(isValidAlgorithm("")).toBe(false);
    });

    it("is case sensitive", () => {
      expect(isValidAlgorithm("MD5")).toBe(false);
      expect(isValidAlgorithm("SHA1")).toBe(false);
      expect(isValidAlgorithm("SHA256")).toBe(false);
      expect(isValidAlgorithm("SHA512")).toBe(false);
    });

    it("handles null and undefined", () => {
      expect(isValidAlgorithm(null as any)).toBe(false);
      expect(isValidAlgorithm(undefined as any)).toBe(false);
    });
  });

  describe("getSupportedAlgorithms", () => {
    it("returns array of supported algorithms", () => {
      const algorithms = getSupportedAlgorithms();
      expect(Array.isArray(algorithms)).toBe(true);
      expect(algorithms.length).toBeGreaterThan(0);
    });

    it("includes all expected algorithms", () => {
      const algorithms = getSupportedAlgorithms();
      expect(algorithms).toContain("md5");
      expect(algorithms).toContain("sha1");
      expect(algorithms).toContain("sha256");
      expect(algorithms).toContain("sha512");
    });

    it("returns the same array each time", () => {
      const algorithms1 = getSupportedAlgorithms();
      const algorithms2 = getSupportedAlgorithms();
      expect(algorithms1).toEqual(algorithms2);
    });

    it("all returned algorithms are valid", () => {
      const algorithms = getSupportedAlgorithms();
      for (const algorithm of algorithms) {
        expect(isValidAlgorithm(algorithm)).toBe(true);
      }
    });
  });

  describe("hashFile", () => {
    it("hashes file with SHA256 by default", () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const result = hashFile(testFile);

      expect(result.algorithm).toBe("SHA256");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // 64 char hex string
      expect(result.filename).toBe(testFile);
      expect(result.size).toBe(content.length);
    });

    it("hashes file with specified algorithm", () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Hello, World!";
      writeFileSync(testFile, content);

      const algorithms: HashAlgorithm[] = ["md5", "sha1", "sha256", "sha512"];
      const expectedLengths = {
        md5: 32,
        sha1: 40,
        sha256: 64,
        sha512: 128,
      };

      for (const algorithm of algorithms) {
        const result = hashFile(testFile, algorithm);
        expect(result.algorithm).toBe(algorithm.toUpperCase());
        expect(result.hash).toMatch(
          new RegExp(`^[a-f0-9]{${expectedLengths[algorithm]}}$`)
        );
        expect(result.filename).toBe(testFile);
        expect(result.size).toBe(content.length);
      }
    });

    it("generates consistent hashes for same content", () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Consistent content";
      writeFileSync(testFile, content);

      const result1 = hashFile(testFile, "sha256");
      const result2 = hashFile(testFile, "sha256");

      expect(result1.hash).toBe(result2.hash);
      expect(result1.algorithm).toBe(result2.algorithm);
      expect(result1.size).toBe(result2.size);
    });

    it("generates different hashes for different content", () => {
      const testFile1 = join(TEMP_DIR, "test1.txt");
      const testFile2 = join(TEMP_DIR, "test2.txt");
      writeFileSync(testFile1, "Content 1");
      writeFileSync(testFile2, "Content 2");

      const result1 = hashFile(testFile1, "sha256");
      const result2 = hashFile(testFile2, "sha256");

      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.filename).not.toBe(result2.filename);
    });

    it("handles empty files", () => {
      const testFile = join(TEMP_DIR, "empty.txt");
      writeFileSync(testFile, "");

      const result = hashFile(testFile, "sha256");

      expect(result.algorithm).toBe("SHA256");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.size).toBe(0);
    });

    it("handles binary files", () => {
      const testFile = join(TEMP_DIR, "binary.bin");
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xff]);
      writeFileSync(testFile, binaryContent);

      const result = hashFile(testFile, "sha256");

      expect(result.algorithm).toBe("SHA256");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.size).toBe(4);
    });
  });

  describe("hashFileMultiple", () => {
    it("generates hashes with all supported algorithms", () => {
      const testFile = join(TEMP_DIR, "test.txt");
      const content = "Test content";
      writeFileSync(testFile, content);

      const results = hashFileMultiple(testFile);

      expect(results.length).toBe(4); // md5, sha1, sha256, sha512

      const algorithms = results.map((r) => r.algorithm.toLowerCase());
      expect(algorithms).toContain("md5");
      expect(algorithms).toContain("sha1");
      expect(algorithms).toContain("sha256");
      expect(algorithms).toContain("sha512");

      // All results should have same filename and size
      for (const result of results) {
        expect(result.filename).toBe(testFile);
        expect(result.size).toBe(content.length);
        expect(result.hash).toMatch(/^[a-f0-9]+$/);
      }
    });

    it("generates different hash lengths for different algorithms", () => {
      const testFile = join(TEMP_DIR, "test.txt");
      writeFileSync(testFile, "Test content");

      const results = hashFileMultiple(testFile);
      const hashLengths = results.map((r) => ({
        algorithm: r.algorithm.toLowerCase(),
        length: r.hash.length,
      }));

      const expectedLengths = [
        { algorithm: "md5", length: 32 },
        { algorithm: "sha1", length: 40 },
        { algorithm: "sha256", length: 64 },
        { algorithm: "sha512", length: 128 },
      ];

      for (const expected of expectedLengths) {
        const actual = hashLengths.find(
          (h) => h.algorithm === expected.algorithm
        );
        expect(actual?.length).toBe(expected.length);
      }
    });
  });

  describe("hashStdin", () => {
    it("hashes stdin data with SHA256 by default", () => {
      const data = "Hello from stdin";
      const result = hashStdin(data);

      expect(result.algorithm).toBe("SHA256");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.filename).toBe("stdin");
      expect(result.size).toBe(data.length);
    });

    it("hashes stdin data with specified algorithm", () => {
      const data = "Test data";
      const algorithms: HashAlgorithm[] = ["md5", "sha1", "sha256", "sha512"];

      for (const algorithm of algorithms) {
        const result = hashStdin(data, algorithm);
        expect(result.algorithm).toBe(algorithm.toUpperCase());
        expect(result.filename).toBe("stdin");
        expect(result.size).toBe(data.length);
      }
    });

    it("handles empty stdin data", () => {
      const result = hashStdin("");

      expect(result.algorithm).toBe("SHA256");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.filename).toBe("stdin");
      expect(result.size).toBe(0);
    });

    it("handles binary stdin data", () => {
      const binaryData = "\x00\x01\x02\xff";
      const result = hashStdin(binaryData);

      expect(result.algorithm).toBe("SHA256");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.filename).toBe("stdin");
      expect(result.size).toBe(4);
    });

    it("generates consistent hashes for same stdin data", () => {
      const data = "Consistent stdin data";
      const result1 = hashStdin(data, "sha256");
      const result2 = hashStdin(data, "sha256");

      expect(result1.hash).toBe(result2.hash);
      expect(result1.algorithm).toBe(result2.algorithm);
      expect(result1.size).toBe(result2.size);
    });
  });

  describe("formatHashResult", () => {
    const mockResult = {
      algorithm: "SHA256",
      hash: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
      filename: "/path/to/test.txt",
      size: 13,
    };

    it("formats result in long format by default", () => {
      const formatted = formatHashResult(mockResult, "long");

      expect(formatted).toContain("SHA256");
      expect(formatted).toContain(mockResult.hash);
      expect(formatted).toContain("/path/to/test.txt");
    });

    it("formats result in short format", () => {
      const formatted = formatHashResult(mockResult, "short");

      expect(formatted).toBe(mockResult.hash);
      expect(formatted).not.toContain("SHA256");
      expect(formatted).not.toContain("/path/to/test.txt");
    });

    it("handles stdin filename in long format", () => {
      const stdinResult = { ...mockResult, filename: "stdin" };
      const formatted = formatHashResult(stdinResult, "long");

      expect(formatted).toContain("SHA256");
      expect(formatted).toContain(mockResult.hash);
      expect(formatted).toContain("stdin");
    });

    it("formats different algorithms correctly", () => {
      const algorithms = ["MD5", "SHA1", "SHA256", "SHA512"];

      for (const algorithm of algorithms) {
        const result = { ...mockResult, algorithm };
        const formatted = formatHashResult(result, "long");
        expect(formatted).toContain(algorithm);
      }
    });

    it("handles various filename formats", () => {
      const filenames = [
        "/absolute/path/file.txt",
        "./relative/path/file.txt",
        "../parent/file.txt",
        "simple-file.txt",
        "file with spaces.txt",
        "stdin",
      ];

      for (const filename of filenames) {
        const result = { ...mockResult, filename };
        const formatted = formatHashResult(result, "long");
        expect(formatted).toContain(filename);
      }
    });
  });

  describe("integration scenarios", () => {
    it("complete workflow with file hashing", () => {
      const testFile = join(TEMP_DIR, "workflow.txt");
      const content = "Integration test content";
      writeFileSync(testFile, content);

      // Check algorithm validity
      expect(isValidAlgorithm("sha256")).toBe(true);

      // Hash the file
      const result = hashFile(testFile, "sha256");
      expect(result.algorithm).toBe("SHA256");
      expect(result.filename).toBe(testFile);

      // Format the result
      const longFormat = formatHashResult(result, "long");
      const shortFormat = formatHashResult(result, "short");

      expect(longFormat).toContain("SHA256");
      expect(longFormat).toContain(result.hash);
      expect(longFormat).toContain(testFile);

      expect(shortFormat).toBe(result.hash);
    });

    it("multi-algorithm hashing workflow", () => {
      const testFile = join(TEMP_DIR, "multi.txt");
      const content = "Multi-algorithm test";
      writeFileSync(testFile, content);

      // Get all supported algorithms
      const algorithms = getSupportedAlgorithms();
      expect(algorithms.length).toBeGreaterThan(0);

      // Hash with multiple algorithms
      const results = hashFileMultiple(testFile);
      expect(results.length).toBe(algorithms.length);

      // Verify all algorithms are represented
      const resultAlgorithms = results.map((r) => r.algorithm.toLowerCase());
      for (const algorithm of algorithms) {
        expect(resultAlgorithms).toContain(algorithm);
      }

      // Format all results
      for (const result of results) {
        const formatted = formatHashResult(result, "long");
        expect(formatted).toContain(result.algorithm);
        expect(formatted).toMatch(/[a-f0-9]+/);
      }
    });

    it("stdin vs file hashing comparison", () => {
      const content = "Same content for both";

      // Hash as stdin
      const stdinResult = hashStdin(content, "sha256");

      // Hash as file
      const testFile = join(TEMP_DIR, "same-content.txt");
      writeFileSync(testFile, content);
      const fileResult = hashFile(testFile, "sha256");

      // Hashes should be identical for same content
      expect(stdinResult.hash).toBe(fileResult.hash);
      expect(stdinResult.algorithm).toBe(fileResult.algorithm);
      expect(stdinResult.size).toBe(fileResult.size);

      // But filenames should differ
      expect(stdinResult.filename).toBe("stdin");
      expect(fileResult.filename).toBe(testFile);
    });

    it("handles real-world file scenarios", () => {
      // JSON file
      const jsonFile = join(TEMP_DIR, "data.json");
      const jsonContent = '{"name": "test", "value": 42}';
      writeFileSync(jsonFile, jsonContent);

      // CSV file
      const csvFile = join(TEMP_DIR, "data.csv");
      const csvContent = "name,age\nJohn,30\nJane,25";
      writeFileSync(csvFile, csvContent);

      // Hash both files
      const jsonResult = hashFile(jsonFile, "sha256");
      const csvResult = hashFile(csvFile, "sha256");

      // Results should be different
      expect(jsonResult.hash).not.toBe(csvResult.hash);
      expect(jsonResult.size).not.toBe(csvResult.size);
      expect(jsonResult.filename).toBe(jsonFile);
      expect(csvResult.filename).toBe(csvFile);

      // Both should format correctly
      const jsonFormatted = formatHashResult(jsonResult, "long");
      const csvFormatted = formatHashResult(csvResult, "long");

      expect(jsonFormatted).toContain(".json");
      expect(csvFormatted).toContain(".csv");
    });
  });
});
