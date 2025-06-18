import { describe, expect, it } from "vitest";
import {
  getFormatFromExtension,
  getFormatFromCompressedFile,
  detectFormat,
  isValidFormat,
  getSupportedFormats,
} from "../../../src/cli/utils/format-detection";

describe("Format detection utilities", () => {
  describe("getFormatFromExtension", () => {
    it("detects JSON format from .json extension", () => {
      expect(getFormatFromExtension("data.json")).toBe("json");
      expect(getFormatFromExtension("/path/to/file.json")).toBe("json");
      expect(getFormatFromExtension("file.JSON")).toBe("json"); // case insensitive
    });

    it("detects XML format from .xml extension", () => {
      expect(getFormatFromExtension("data.xml")).toBe("xml");
      expect(getFormatFromExtension("/path/to/file.xml")).toBe("xml");
      expect(getFormatFromExtension("file.XML")).toBe("xml");
    });

    it("detects CSV format from .csv extension", () => {
      expect(getFormatFromExtension("data.csv")).toBe("csv");
      expect(getFormatFromExtension("/path/to/file.csv")).toBe("csv");
      expect(getFormatFromExtension("file.CSV")).toBe("csv");
    });

    it("detects YAML format from .yaml and .yml extensions", () => {
      expect(getFormatFromExtension("data.yaml")).toBe("yaml");
      expect(getFormatFromExtension("data.yml")).toBe("yaml");
      expect(getFormatFromExtension("/path/to/file.YAML")).toBe("yaml");
      expect(getFormatFromExtension("/path/to/file.YML")).toBe("yaml");
    });

    it("returns null for unknown extensions", () => {
      expect(getFormatFromExtension("data.txt")).toBeNull();
      expect(getFormatFromExtension("data.unknown")).toBeNull();
      expect(getFormatFromExtension("data")).toBeNull();
      expect(getFormatFromExtension("")).toBeNull();
    });

    it("handles files without extensions", () => {
      expect(getFormatFromExtension("README")).toBeNull();
      expect(getFormatFromExtension("/path/to/file")).toBeNull();
    });

    it("handles complex paths", () => {
      expect(getFormatFromExtension("/complex/path/with.dots/file.json")).toBe(
        "json"
      );
      expect(getFormatFromExtension("./relative/path/data.yaml")).toBe("yaml");
      expect(getFormatFromExtension("../parent/dir/config.xml")).toBe("xml");
    });
  });

  describe("getFormatFromCompressedFile", () => {
    it("detects format from tar.gz files", () => {
      expect(getFormatFromCompressedFile("data.json.tar.gz")).toBe("json");
      expect(getFormatFromCompressedFile("config.yaml.tgz")).toBe("yaml");
      expect(getFormatFromCompressedFile("data.xml.tar.gz")).toBe("xml");
      expect(getFormatFromCompressedFile("export.csv.tar.gz")).toBe("csv");
    });

    it("detects format from gzip files", () => {
      expect(getFormatFromCompressedFile("data.json.gz")).toBe("json");
      expect(getFormatFromCompressedFile("config.yaml.gz")).toBe("yaml");
      expect(getFormatFromCompressedFile("data.xml.gz")).toBe("xml");
      expect(getFormatFromCompressedFile("export.csv.gz")).toBe("csv");
    });

    it("defaults to json for zip files", () => {
      expect(getFormatFromCompressedFile("data.zip")).toBe("json");
      expect(getFormatFromCompressedFile("archive.zip")).toBe("json");
    });

    it("detects format from tar files", () => {
      expect(getFormatFromCompressedFile("data.json.tar")).toBe("json");
      expect(getFormatFromCompressedFile("config.yaml.tar")).toBe("yaml");
      expect(getFormatFromCompressedFile("data.xml.tar")).toBe("xml");
      expect(getFormatFromCompressedFile("export.csv.tar")).toBe("csv");
    });

    it("defaults to json for unknown inner formats", () => {
      expect(getFormatFromCompressedFile("unknown.txt.gz")).toBe("json");
      expect(getFormatFromCompressedFile("binary.bin.tar.gz")).toBe("json");
    });

    it("returns null for non-compressed files", () => {
      expect(getFormatFromCompressedFile("data.json")).toBeNull();
      expect(getFormatFromCompressedFile("config.yaml")).toBeNull();
    });
  });

  describe("detectFormat", () => {
    it("detects JSON format from content starting with {", () => {
      expect(detectFormat('{"key": "value"}')).toBe("json");
      expect(detectFormat('  {"key": "value"}  ')).toBe("json"); // with whitespace
    });

    it("detects JSON format from content starting with [", () => {
      expect(detectFormat('[{"key": "value"}]')).toBe("json");
      expect(detectFormat("  [1, 2, 3]  ")).toBe("json"); // with whitespace
    });

    it("detects XML format from content starting with <", () => {
      expect(detectFormat("<root><item>value</item></root>")).toBe("xml");
      expect(detectFormat("  <xml>content</xml>  ")).toBe("xml"); // with whitespace
      expect(detectFormat('<?xml version="1.0"?><root/>')).toBe("xml");
    });

    it("detects YAML format from content starting with ---", () => {
      expect(detectFormat("---\nkey: value")).toBe("yaml");
      expect(detectFormat("  ---\ndata: test  ")).toBe("yaml"); // with whitespace
    });

    it("detects YAML format from key:value pattern", () => {
      expect(detectFormat("key: value")).toBe("yaml");
      expect(detectFormat("name: John Doe")).toBe("yaml");
      expect(detectFormat("config_setting: true")).toBe("yaml");
      expect(detectFormat("_private: data")).toBe("yaml");
    });

    it("defaults to CSV for unrecognized content", () => {
      expect(detectFormat("name,age,city")).toBe("csv");
      expect(detectFormat("plain text content")).toBe("csv");
      expect(detectFormat("123,456,789")).toBe("csv");
      expect(detectFormat("")).toBe("csv");
    });

    it("handles mixed content correctly", () => {
      // Content that might be ambiguous
      expect(detectFormat("not_yaml_key value")).toBe("csv"); // no colon
      expect(detectFormat("url: https://example.com")).toBe("yaml"); // valid yaml
      expect(detectFormat("email@domain.com")).toBe("csv"); // not yaml pattern
    });

    it("handles edge cases", () => {
      expect(detectFormat(" ")).toBe("csv"); // whitespace only
      expect(detectFormat("\n\n")).toBe("csv"); // newlines only
      expect(detectFormat("\t")).toBe("csv"); // tab only
    });
  });

  describe("isValidFormat", () => {
    it("returns true for supported formats", () => {
      expect(isValidFormat("json")).toBe(true);
      expect(isValidFormat("xml")).toBe(true);
      expect(isValidFormat("csv")).toBe(true);
      expect(isValidFormat("yaml")).toBe(true);
    });

    it("returns false for unsupported formats", () => {
      expect(isValidFormat("txt")).toBe(false);
      expect(isValidFormat("html")).toBe(false);
      expect(isValidFormat("unknown")).toBe(false);
      expect(isValidFormat("")).toBe(false);
    });

    it("is case sensitive", () => {
      expect(isValidFormat("JSON")).toBe(false);
      expect(isValidFormat("XML")).toBe(false);
      expect(isValidFormat("CSV")).toBe(false);
      expect(isValidFormat("YAML")).toBe(false);
    });

    it("handles null and undefined", () => {
      expect(isValidFormat(null as any)).toBe(false);
      expect(isValidFormat(undefined as any)).toBe(false);
    });
  });

  describe("getSupportedFormats", () => {
    it("returns array of supported formats", () => {
      const formats = getSupportedFormats();
      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
    });

    it("includes all expected formats", () => {
      const formats = getSupportedFormats();
      expect(formats).toContain("json");
      expect(formats).toContain("xml");
      expect(formats).toContain("csv");
      expect(formats).toContain("yaml");
    });

    it("returns the same array each time", () => {
      const formats1 = getSupportedFormats();
      const formats2 = getSupportedFormats();
      expect(formats1).toEqual(formats2);
    });

    it("all returned formats are valid", () => {
      const formats = getSupportedFormats();
      for (const format of formats) {
        expect(isValidFormat(format)).toBe(true);
      }
    });
  });

  describe("integration scenarios", () => {
    it("format detection chain works correctly", () => {
      // Test the typical flow: extension -> content detection
      const jsonFile = "/path/to/data.json";
      const formatFromExt = getFormatFromExtension(jsonFile);
      expect(formatFromExt).toBe("json");
      if (formatFromExt) {
        expect(isValidFormat(formatFromExt)).toBe(true);
      }

      // If extension detection fails, fall back to content
      const unknownFile = "/path/to/data.unknown";
      const noFormatFromExt = getFormatFromExtension(unknownFile);
      expect(noFormatFromExt).toBeNull();

      const jsonContent = '{"key": "value"}';
      const formatFromContent = detectFormat(jsonContent);
      expect(formatFromContent).toBe("json");
      expect(isValidFormat(formatFromContent)).toBe(true);
    });

    it("compressed file detection works", () => {
      const compressedJsonFile = "data.json.gz";
      const format = getFormatFromCompressedFile(compressedJsonFile);
      expect(format).toBe("json");
      if (format) {
        expect(isValidFormat(format)).toBe(true);
      }
    });

    it("handles complex real-world scenarios", () => {
      // API response file
      expect(getFormatFromExtension("api-response.json")).toBe("json");

      // Configuration files
      expect(getFormatFromExtension("config.yaml")).toBe("yaml");
      expect(getFormatFromExtension("settings.yml")).toBe("yaml");

      // Data export files
      expect(getFormatFromExtension("users-export.csv")).toBe("csv");

      // Log files (unknown extension, would need content detection)
      expect(getFormatFromExtension("application.log")).toBeNull();
      expect(detectFormat("2023-01-01 INFO: Application started")).toBe("csv");

      // Compressed backups
      expect(getFormatFromCompressedFile("backup.json.gz")).toBe("json");
    });
  });
});
