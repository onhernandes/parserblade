import { z } from "zod";
import { NotImplementedError } from "../../src/errors/NotImplemented";
import { ParserError } from "../../src/errors/ParserError";
import { Yaml } from "../../src/strategies/Yaml";
import type { ValidationOptions } from "../../src/types";

const strategy = new Yaml();

describe("Yaml Parser", () => {
  describe("Yaml.prototype.parse()", () => {
    it("parses YAML to JS object", () => {
      const data = "series: Bleach\nseasons: 16";
      const result = strategy.parse(data);
      expect(result).toEqual({ series: "Bleach", seasons: 16 });
    });
  });

  describe("Yaml.prototype.stringify()", () => {
    it("turns JS into YAML", () => {
      const data = { series: "Bleach", seasons: 16 };
      const result = strategy.stringify(data);
      const expected = "series: Bleach\nseasons: 16";

      expect(result).toEqual(expect.stringMatching(expected));
    });

    it("throws ParserError when calling stringify() with array data", () => {
      expect(() => {
        strategy.stringify([]);
      }).toThrow(ParserError);
    });
  });

  describe("Yaml.prototype.pipe()", () => {
    it("throws NotImplementedError for pipe()", () => {
      if (typeof (strategy as any).pipe === "function") {
        expect(() => (strategy as any).pipe()).toThrow(NotImplementedError);
      } else {
        expect(() => (strategy as any).pipe()).toThrow();
      }
    });
  });

  describe("Yaml.prototype.valid()", () => {
    it("returns false for invalid input data", () => {
      const result = strategy.valid("[name:\nStardew");
      expect(result).toBe(false);
    });

    it("returns true for valid input data", () => {
      const result = strategy.valid('name:"Stardew Valley"');
      expect(result).toBe(true);
    });
  });
});

describe("YAML Strategy - Zod Validation", () => {
  const yamlStrategy = new Yaml();

  it("should validate YAML data with schema", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const validData = `name: John
age: 30`;

    const validationOptions: ValidationOptions = {
      schema,
    };

    const result = yamlStrategy.validateSchema(validData, validationOptions);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "John", age: 30 });
  });

  it("should fail validation for invalid YAML schema", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const invalidData = `name: John
age: invalid`;

    const validationOptions: ValidationOptions = {
      schema,
      throwOnError: false,
    };

    const result = yamlStrategy.validateSchema(invalidData, validationOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should validate nested YAML objects", () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        settings: z.object({
          theme: z.enum(["light", "dark"]),
        }),
      }),
    });

    const validData = `user:
  name: John
  settings:
    theme: dark`;

    const validationOptions: ValidationOptions = {
      schema,
    };

    const result = yamlStrategy.validateSchema(validData, validationOptions);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("user.name", "John");
    expect(result.data).toHaveProperty("user.settings.theme", "dark");
  });
});
