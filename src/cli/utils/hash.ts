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
 * Get list of supported hash algorithms
 */
export function getSupportedAlgorithms(): HashAlgorithm[] {
  return ["md5", "sha1", "sha256", "sha512"];
}

/**
 * Check if algorithm is supported
 */
export function isValidAlgorithm(
  algorithm: string
): algorithm is HashAlgorithm {
  return getSupportedAlgorithms().includes(algorithm as HashAlgorithm);
}

/**
 * Generate hash from string data
 */
export function hashData(
  data: string,
  algorithm: HashAlgorithm = "sha256"
): string {
  const hash = createHash(algorithm);
  hash.update(data, "utf8");
  return hash.digest("hex");
}

/**
 * Generate hash from file
 */
export function hashFile(
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
 */
export function hashFileMultiple(
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
 * Generate hash from stdin data
 */
export function hashStdin(
  data: string,
  algorithm: HashAlgorithm = "sha256"
): HashResult {
  const hash = createHash(algorithm);
  hash.update(data, "utf8");

  return {
    algorithm,
    hash: hash.digest("hex"),
    size: Buffer.byteLength(data, "utf8"),
  };
}

/**
 * Format hash result for display
 */
export function formatHashResult(
  result: HashResult,
  format: "short" | "long" = "long"
): string {
  if (format === "short") {
    return result.hash;
  }

  const parts = [`${result.algorithm.toUpperCase()}: ${result.hash}`];

  if (result.file) {
    parts.push(`File: ${result.file}`);
  }

  if (result.size !== undefined) {
    parts.push(`Size: ${result.size} bytes`);
  }

  return parts.join(" | ");
}
