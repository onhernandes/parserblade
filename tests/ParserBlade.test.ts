import { Transform } from "node:stream";
import { describe, expect, it } from "vitest";
import { ParserBlade } from "../src/ParserBlade";
import { ParserError } from "../src/errors";

describe("ParserBlade", () => {
  let parserBlade: ParserBlade;

  beforeEach(() => {
    parserBlade = new ParserBlade();
  });

  describe("constructor", () => {
    it("initializes with all supported strategies", () => {
      expect(parserBlade.strategies).toHaveProperty("json");
      expect(parserBlade.strategies).toHaveProperty("csv");
      expect(parserBlade.strategies).toHaveProperty("xml");
      expect(parserBlade.strategies).toHaveProperty("yaml");
    });

    it("strategies are instances of their respective classes", () => {
      expect(parserBlade.strategies.json.constructor.name).toBe("Json");
      expect(parserBlade.strategies.csv.constructor.name).toBe("Csv");
      expect(parserBlade.strategies.xml.constructor.name).toBe("Xml");
      expect(parserBlade.strategies.yaml.constructor.name).toBe("Yaml");
    });
  });

  describe("parse", () => {
    it("parses JSON data correctly", () => {
      const data = '{"name": "test", "value": 42}';
      const result = parserBlade.parse({ fileType: "json" }, data);
      expect(result).toEqual({ name: "test", value: 42 });
    });

    it("parses CSV data correctly", () => {
      const data = "name,age\nJohn,30\nJane,25";
      const result = parserBlade.parse({ fileType: "csv" }, data);
      expect(result).toEqual([
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ]);
    });

    it("parses XML data correctly", () => {
      const data = "<root><item>test</item></root>";
      const result = parserBlade.parse({ fileType: "xml" }, data);
      expect(result).toHaveProperty("root");
    });

    it("parses YAML data correctly", () => {
      const data = "name: test\nvalue: 42";
      const result = parserBlade.parse({ fileType: "yaml" }, data);
      expect(result).toEqual({ name: "test", value: 42 });
    });

    it("passes options to JSON parser", () => {
      const data = '{"name": "test", "value": 42}';
      const result = parserBlade.parse(
        {
          fileType: "json",
          options: { reviver: (key: string, value: any) => (key === "value" ? value * 2 : value) },
        },
        data,
      );
      expect(result).toEqual({ name: "test", value: 84 });
    });

    it("passes options to CSV parser", () => {
      const data = "name;age\nJohn;30\nJane;25";
      const result = parserBlade.parse({ fileType: "csv", options: { delimiter: ";" } }, data);
      expect(result).toEqual([
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ]);
    });

    it("throws ParserError for unsupported file type", () => {
      expect(() => {
        parserBlade.parse({ fileType: "unknown" as any }, "data");
      }).toThrow(ParserError);
    });

    it("throws ParserError with correct message for unsupported file type", () => {
      expect(() => {
        parserBlade.parse({ fileType: "unknown" as any }, "data");
      }).toThrow("Unsupported file type: unknown");
    });
  });

  describe("stringify", () => {
    it("stringifies JSON data correctly", () => {
      const data = { name: "test", value: 42 };
      const result = parserBlade.stringify({ fileType: "json" }, data);
      expect(result).toBe('{"name":"test","value":42}');
    });

    it("stringifies CSV data correctly", () => {
      const data = [
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ];
      const result = parserBlade.stringify({ fileType: "csv" }, data);
      expect(result).toContain("name,age");
      expect(result).toContain("John,30");
      expect(result).toContain("Jane,25");
    });

    it("stringifies XML data correctly", () => {
      const data = { root: { item: "test" } };
      const result = parserBlade.stringify({ fileType: "xml" }, data);
      expect(result).toContain("<root>");
      expect(result).toContain("<item>test</item>");
      expect(result).toContain("</root>");
    });

    it("stringifies YAML data correctly", () => {
      const data = { name: "test", value: 42 };
      const result = parserBlade.stringify({ fileType: "yaml" }, data);
      expect(result).toContain("name: test");
      expect(result).toContain("value: 42");
    });

    it("passes options to JSON stringifier", () => {
      const data = { name: "test", value: 42 };
      const result = parserBlade.stringify({ fileType: "json", options: { space: 2 } }, data);
      expect(result).toContain('  "name": "test"');
    });

    it("passes options to CSV stringifier", () => {
      const data = [
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ];
      const result = parserBlade.stringify({ fileType: "csv", options: { delimiter: ";" } }, data);
      expect(result).toContain("name;age");
      expect(result).toContain("John;30");
    });

    it("throws ParserError for unsupported file type", () => {
      expect(() => {
        parserBlade.stringify({ fileType: "unknown" as any }, {});
      }).toThrow(ParserError);
    });
  });

  describe("valid", () => {
    it("validates JSON data correctly", () => {
      expect(parserBlade.valid({ fileType: "json" }, '{"valid": true}')).toBe(true);
      expect(parserBlade.valid({ fileType: "json" }, '{"invalid": }')).toBe(false);
    });

    it("validates CSV data correctly", () => {
      expect(parserBlade.valid({ fileType: "csv" }, "name,age\nJohn,30")).toBe(true);
      expect(parserBlade.valid({ fileType: "csv" }, "")).toBe(true);
    });

    it("validates XML data correctly", () => {
      expect(parserBlade.valid({ fileType: "xml" }, "<root></root>")).toBe(true);
      expect(parserBlade.valid({ fileType: "xml" }, "<root><unclosed>")).toBe(false);
    });

    it("validates YAML data correctly", () => {
      expect(parserBlade.valid({ fileType: "yaml" }, "name: test")).toBe(true);
      expect(parserBlade.valid({ fileType: "yaml" }, "name: test\n  invalid: [")).toBe(false);
    });

    it("returns false for unsupported file type", () => {
      const result = parserBlade.valid({ fileType: "unknown" as any }, "data");
      expect(result).toBe(false);
    });

    it("passes options to validation", () => {
      const result = parserBlade.valid(
        { fileType: "csv", options: { delimiter: ";" } },
        "name;age\nJohn;30",
      );
      expect(result).toBe(true);
    });
  });

  describe("pipeParse", () => {
    it("returns Transform stream for JSON", () => {
      const stream = parserBlade.pipeParse({ fileType: "json" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("returns Transform stream for CSV", () => {
      const stream = parserBlade.pipeParse({ fileType: "csv" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("returns Transform stream for XML", () => {
      const stream = parserBlade.pipeParse({ fileType: "xml" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("returns Transform stream for YAML", () => {
      const stream = parserBlade.pipeParse({ fileType: "yaml" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("handles YAML without options", () => {
      const stream = parserBlade.pipeParse({ fileType: "yaml", options: undefined as never });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("passes options to JSON pipe parser", () => {
      const stream = parserBlade.pipeParse({
        fileType: "json",
        options: { path: "*" },
      });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("passes options to CSV pipe parser", () => {
      const stream = parserBlade.pipeParse({
        fileType: "csv",
        options: { delimiter: ";" },
      });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("passes options to XML pipe parser", () => {
      const stream = parserBlade.pipeParse({
        fileType: "xml",
        options: { depth: 2 },
      });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("throws ParserError for unsupported file type", () => {
      expect(() => {
        parserBlade.pipeParse({ fileType: "unknown" as any });
      }).toThrow(ParserError);
    });
  });

  describe("pipeStringify", () => {
    it("returns Transform stream for JSON", () => {
      const stream = parserBlade.pipeStringify({ fileType: "json" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("returns Transform stream for CSV", () => {
      const stream = parserBlade.pipeStringify({ fileType: "csv" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("returns Transform stream for XML", () => {
      const stream = parserBlade.pipeStringify({ fileType: "xml" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("returns Transform stream for YAML", () => {
      const stream = parserBlade.pipeStringify({ fileType: "yaml" });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("handles YAML without options", () => {
      const stream = parserBlade.pipeStringify({ fileType: "yaml", options: undefined as never });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("passes options to JSON pipe stringifier", () => {
      const stream = parserBlade.pipeStringify({
        fileType: "json",
        options: { type: "array" },
      });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("passes options to CSV pipe stringifier", () => {
      const stream = parserBlade.pipeStringify({
        fileType: "csv",
        options: { delimiter: ";" },
      });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("passes options to XML pipe stringifier", () => {
      const stream = parserBlade.pipeStringify({
        fileType: "xml",
        options: { mainTag: { name: "root" } },
      });
      expect(stream).toBeInstanceOf(Transform);
    });

    it("throws ParserError for unsupported file type", () => {
      expect(() => {
        parserBlade.pipeStringify({ fileType: "unknown" as any });
      }).toThrow(ParserError);
    });
  });

  describe("integration scenarios", () => {
    it("can parse and stringify JSON roundtrip", () => {
      const original = { name: "test", values: [1, 2, 3] };
      const stringified = parserBlade.stringify({ fileType: "json" }, original);
      const parsed = parserBlade.parse({ fileType: "json" }, stringified);
      expect(parsed).toEqual(original);
    });

    it("can parse and stringify CSV roundtrip", () => {
      const original = [
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ];
      const stringified = parserBlade.stringify({ fileType: "csv" }, original);
      const parsed = parserBlade.parse({ fileType: "csv" }, stringified);
      expect(parsed).toEqual(original);
    });

    it("can parse and stringify YAML roundtrip", () => {
      const original = { name: "test", value: 42 };
      const stringified = parserBlade.stringify({ fileType: "yaml" }, original);
      const parsed = parserBlade.parse({ fileType: "yaml" }, stringified);
      expect(parsed).toEqual(original);
    });
  });
});
