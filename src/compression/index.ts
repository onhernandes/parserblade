import {
  createReadStream,
  createWriteStream,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createGzip, createGunzip, gzipSync, gunzipSync } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { basename } from "node:path";
import * as tar from "tar";
import AdmZip from "adm-zip";

/**
 * Supported compression formats
 */
export type CompressionFormat = "gzip" | "tar" | "tar.gz" | "zip";

/**
 * Compression options for different formats
 */
export interface CompressionOptions {
  level?: number; // Compression level (1-9)
  format?: CompressionFormat;
}

/**
 * Decompression result interface
 */
export interface DecompressionResult {
  format: CompressionFormat;
  files: Array<{
    name: string;
    content: string | Buffer;
    size: number;
  }>;
  totalFiles: number;
  totalSize: number;
}

/**
 * Detect compression format from file extension or content
 */
export function detectCompressionFormat(
  filePath: string
): CompressionFormat | null {
  const fileName = basename(filePath).toLowerCase();

  if (fileName.endsWith(".tar.gz") || fileName.endsWith(".tgz")) {
    return "tar.gz";
  }

  if (fileName.endsWith(".tar")) {
    return "tar";
  }

  if (fileName.endsWith(".gz")) {
    return "gzip";
  }

  if (fileName.endsWith(".zip")) {
    return "zip";
  }

  return null;
}

/**
 * Check if file is compressed
 */
export function isCompressed(filePath: string): boolean {
  return detectCompressionFormat(filePath) !== null;
}

/**
 * Get supported compression formats
 */
export function getSupportedCompressionFormats(): CompressionFormat[] {
  return ["gzip", "tar", "tar.gz", "zip"];
}

/**
 * Compress string data to gzip
 */
export function compressData(
  data: string,
  options: CompressionOptions = {}
): Buffer {
  const level = options.level ?? 6;
  return gzipSync(Buffer.from(data, "utf8"), { level });
}

/**
 * Decompress gzip data to string
 */
export function decompressData(data: Buffer): string {
  return gunzipSync(data).toString("utf8");
}

/**
 * Compress file to gzip
 */
export async function compressFile(
  inputPath: string,
  outputPath: string,
  options: CompressionOptions = {}
): Promise<void> {
  const level = options.level ?? 6;
  const gzip = createGzip({ level });

  await pipeline(
    createReadStream(inputPath),
    gzip,
    createWriteStream(outputPath)
  );
}

/**
 * Decompress gzip file
 */
export async function decompressFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const gunzip = createGunzip();

  await pipeline(
    createReadStream(inputPath),
    gunzip,
    createWriteStream(outputPath)
  );
}

/**
 * Read and decompress file based on its format
 */
export function readCompressedFile(filePath: string): DecompressionResult {
  const format = detectCompressionFormat(filePath);

  if (!format) {
    throw new Error(`Unsupported compression format for file: ${filePath}`);
  }

  switch (format) {
    case "gzip":
      return readGzipFile(filePath);
    case "tar":
      return readTarFile(filePath);
    case "tar.gz":
      return readTarGzFile(filePath);
    case "zip":
      return readZipFile(filePath);
    default:
      throw new Error(`Unsupported compression format: ${format}`);
  }
}

/**
 * Read gzip file
 */
function readGzipFile(filePath: string): DecompressionResult {
  const compressedData = readFileSync(filePath);
  const content = decompressData(compressedData);

  return {
    format: "gzip",
    files: [
      {
        name: basename(filePath, ".gz"),
        content,
        size: content.length,
      },
    ],
    totalFiles: 1,
    totalSize: content.length,
  };
}

/**
 * Read tar file
 */
function readTarFile(filePath: string): DecompressionResult {
  // Read tar file synchronously
  const tarData = readFileSync(filePath);

  // Parse tar manually (simplified approach)
  // In a real implementation, you'd use a proper tar parsing library
  // For now, we'll use the tar library with a temporary approach

  const result: DecompressionResult = {
    format: "tar",
    files: [],
    totalFiles: 0,
    totalSize: 0,
  };

  // This is a simplified implementation
  // In practice, you'd need to properly extract tar contents
  result.files.push({
    name: basename(filePath, ".tar"),
    content: tarData,
    size: tarData.length,
  });

  result.totalFiles = result.files.length;
  result.totalSize = tarData.length;

  return result;
}

/**
 * Read tar.gz file
 */
function readTarGzFile(filePath: string): DecompressionResult {
  // First decompress gzip, then read tar
  const compressedData = readFileSync(filePath);
  const tarData = decompressData(compressedData);

  const result: DecompressionResult = {
    format: "tar.gz",
    files: [
      {
        name: basename(filePath, ".tar.gz"),
        content: tarData,
        size: tarData.length,
      },
    ],
    totalFiles: 1,
    totalSize: tarData.length,
  };

  return result;
}

/**
 * Read zip file
 */
function readZipFile(filePath: string): DecompressionResult {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  const files = entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => ({
      name: entry.entryName,
      content: entry.getData().toString("utf8"),
      size: entry.header.size,
    }));

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return {
    format: "zip",
    files,
    totalFiles: files.length,
    totalSize,
  };
}

/**
 * Extract first text file from compressed archive
 * Useful for parsing compressed config files
 */
export function extractFirstTextFile(filePath: string): string {
  const result = readCompressedFile(filePath);

  if (result.files.length === 0) {
    throw new Error(`No files found in compressed archive: ${filePath}`);
  }

  // Return first file content as string
  const firstFile = result.files[0];
  if (!firstFile) {
    throw new Error("No files found in the compressed archive");
  }

  return typeof firstFile.content === "string"
    ? firstFile.content
    : firstFile.content.toString("utf8");
}

/**
 * Create compressed file from data
 */
export function writeCompressedFile(
  data: string,
  outputPath: string,
  options: CompressionOptions = {}
): void {
  const format =
    options.format || detectCompressionFormat(outputPath) || "gzip";

  switch (format) {
    case "gzip":
      writeGzipFile(data, outputPath, options);
      break;
    case "zip":
      writeZipFile(data, outputPath);
      break;
    default:
      throw new Error(`Writing ${format} files is not yet supported`);
  }
}

/**
 * Write gzip file
 */
function writeGzipFile(
  data: string,
  outputPath: string,
  options: CompressionOptions
): void {
  const compressed = compressData(data, options);
  writeFileSync(outputPath, compressed);
}

/**
 * Write zip file
 */
function writeZipFile(data: string, outputPath: string): void {
  const zip = new AdmZip();
  const fileName = `${basename(outputPath, ".zip")}.txt`;
  zip.addFile(fileName, Buffer.from(data, "utf8"));
  zip.writeZip(outputPath);
}
