import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Supported hash algorithms
 */
export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

/**
 * Hash result interface
 */
export interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
  file?: string;
  size?: number;
}

/**
 * Hash utility class for generating checksums
 */
export class Hash {
  /**
   * Get list of supported hash algorithms
   */
  static getSupportedAlgorithms(): HashAlgorithm[] {
    return ["md5", "sha1", "sha256", "sha512"];
  }

  /**
   * Check if algorithm is supported
   */
  static isValidAlgorithm(algorithm: string): algorithm is HashAlgorithm {
    return Hash.getSupportedAlgorithms().includes(algorithm as HashAlgorithm);
  }

  /**
   * Generate hash from string data
   *
   * @param data - String data to hash
   * @param algorithm - Hash algorithm to use (default: sha256)
   * @returns The hash as a hex string
   *
   * @example
   * ```typescript
   * const hash = Hash.data("Hello, World!", "sha256");
   * console.log(hash); // "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
   * ```
   */
  static data(data: string, algorithm: HashAlgorithm = "sha256"): string {
    const hash = createHash(algorithm);
    hash.update(data, "utf8");
    return hash.digest("hex");
  }

  /**
   * Generate hash from file
   *
   * @param filePath - Path to the file to hash
   * @param algorithm - Hash algorithm to use (default: sha256)
   * @returns Hash result with metadata
   *
   * @example
   * ```typescript
   * const result = Hash.file("package.json", "sha256");
   * console.log(result.hash); // "abc123..."
   * console.log(result.size); // 1234
   * ```
   */
  static file(
    filePath: string,
    algorithm: HashAlgorithm = "sha256"
  ): HashResult {
    const data = readFileSync(filePath);
    const hash = createHash(algorithm);
    hash.update(data);

    return {
      algorithm,
      hash: hash.digest("hex"),
      file: filePath,
      size: data.length,
    };
  }

  /**
   * Generate multiple hashes from file
   *
   * @param filePath - Path to the file to hash
   * @param algorithms - Array of algorithms to use (default: ["md5", "sha256"])
   * @returns Array of hash results
   *
   * @example
   * ```typescript
   * const results = Hash.fileMultiple("data.txt", ["md5", "sha256", "sha512"]);
   * results.forEach(result => {
   *   console.log(`${result.algorithm}: ${result.hash}`);
   * });
   * ```
   */
  static fileMultiple(
    filePath: string,
    algorithms: HashAlgorithm[] = ["md5", "sha256"]
  ): HashResult[] {
    const data = readFileSync(filePath);

    return algorithms.map((algorithm) => {
      const hash = createHash(algorithm);
      hash.update(data);

      return {
        algorithm,
        hash: hash.digest("hex"),
        file: filePath,
        size: data.length,
      };
    });
  }

  /**
   * Generate hash from Buffer data
   *
   * @param buffer - Buffer data to hash
   * @param algorithm - Hash algorithm to use (default: sha256)
   * @returns Hash result with metadata
   *
   * @example
   * ```typescript
   * const buffer = Buffer.from("Hello, World!", "utf8");
   * const result = Hash.buffer(buffer, "md5");
   * console.log(result.hash); // "65a8e27d8879283831b664bd8b7f0ad4"
   * ```
   */
  static buffer(
    buffer: Buffer,
    algorithm: HashAlgorithm = "sha256"
  ): HashResult {
    const hash = createHash(algorithm);
    hash.update(buffer);

    return {
      algorithm,
      hash: hash.digest("hex"),
      size: buffer.length,
    };
  }

  /**
   * Verify if data matches expected hash
   *
   * @param data - String data to verify
   * @param expectedHash - Expected hash value
   * @param algorithm - Hash algorithm to use (default: sha256)
   * @returns True if hash matches, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = Hash.verify("Hello, World!", "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f");
   * console.log(isValid); // true
   * ```
   */
  static verify(
    data: string,
    expectedHash: string,
    algorithm: HashAlgorithm = "sha256"
  ): boolean {
    const actualHash = Hash.data(data, algorithm);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
  }

  /**
   * Verify if file matches expected hash
   *
   * @param filePath - Path to the file to verify
   * @param expectedHash - Expected hash value
   * @param algorithm - Hash algorithm to use (default: sha256)
   * @returns True if hash matches, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = Hash.verifyFile("data.txt", "abc123...");
   * console.log(isValid); // true or false
   * ```
   */
  static verifyFile(
    filePath: string,
    expectedHash: string,
    algorithm: HashAlgorithm = "sha256"
  ): boolean {
    const result = Hash.file(filePath, algorithm);
    return result.hash.toLowerCase() === expectedHash.toLowerCase();
  }
}

// Export individual functions for convenience
export const hashData = Hash.data;
export const hashFile = Hash.file;
export const hashFileMultiple = Hash.fileMultiple;
export const hashBuffer = Hash.buffer;
export const verifyData = Hash.verify;
export const verifyFile = Hash.verifyFile;
export const getSupportedAlgorithms = Hash.getSupportedAlgorithms;
export const isValidAlgorithm = Hash.isValidAlgorithm;
