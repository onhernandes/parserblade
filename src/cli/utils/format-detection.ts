import { extname } from "node:path";
import type { DataFormat } from "../../types";

/**
 * Map file extensions to formats
 */
export const getFormatFromExtension = (filePath: string): DataFormat | null => {
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
