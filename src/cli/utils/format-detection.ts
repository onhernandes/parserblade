import { extname, basename } from "node:path";
import type { DataFormat } from "../../types";
import { isCompressed, detectCompressionFormat } from "../../compression";

/**
 * Map file extensions to formats
 */
export const getFormatFromExtension = (filePath: string): DataFormat | null => {
  // Handle compressed files
  if (isCompressed(filePath)) {
    return getFormatFromCompressedFile(filePath);
  }

  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case ".json":
      return "json";
    case ".xml":
      return "xml";
    case ".csv":
      return "csv";
    case ".yaml":
    case ".yml":
      return "yaml";
    default:
      return null;
  }
};

/**
 * Get format from compressed file by looking at the inner file name
 */
export const getFormatFromCompressedFile = (
  filePath: string
): DataFormat | null => {
  const compressionFormat = detectCompressionFormat(filePath);
  const fileName = basename(filePath).toLowerCase();

  if (!compressionFormat) {
    return null;
  }

  // Remove compression extensions to get the inner file format
  let innerFileName = fileName;

  if (compressionFormat === "tar.gz") {
    innerFileName = fileName.replace(/\.tar\.gz$|\.tgz$/, "");
  } else if (compressionFormat === "gzip") {
    innerFileName = fileName.replace(/\.gz$/, "");
  } else if (compressionFormat === "zip") {
    // For zip files, we'll need to examine the content
    // For now, default to json
    return "json";
  } else if (compressionFormat === "tar") {
    innerFileName = fileName.replace(/\.tar$/, "");
  }

  // Get format from the inner file name
  if (innerFileName.endsWith(".json")) return "json";
  if (innerFileName.endsWith(".xml")) return "xml";
  if (innerFileName.endsWith(".csv")) return "csv";
  if (innerFileName.endsWith(".yaml") || innerFileName.endsWith(".yml"))
    return "yaml";

  // Default to json for compressed files
  return "json";
};

/**
 * Auto-detect format from content
 */
export const detectFormat = (content: string): DataFormat => {
  // Try to detect format based on content
  const trimmed = content.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }

  if (trimmed.startsWith("<")) {
    return "xml";
  }

  // Simple heuristic for YAML (starts with --- or has key: value pattern)
  if (
    trimmed.startsWith("---") ||
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(trimmed)
  ) {
    return "yaml";
  }

  // Default to CSV for everything else
  return "csv";
};

/**
 * Validate if a format is supported
 */
export const isValidFormat = (format: string): format is DataFormat => {
  const supportedFormats: DataFormat[] = ["json", "xml", "csv", "yaml"];
  return supportedFormats.includes(format as DataFormat);
};

/**
 * Get all supported formats
 */
export const getSupportedFormats = (): DataFormat[] => {
  return ["json", "xml", "csv", "yaml"];
};
