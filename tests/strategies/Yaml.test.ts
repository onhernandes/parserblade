import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ParserError } from "../../src/errors";
import { NotImplementedError } from "../../src/errors/NotImplemented";
import { Yaml } from "../../src/strategies/Yaml";
import { ZodAdapter } from "../../src/validation/adapters/ZodAdapter";
import type { ValidationOptions } from "../../src/types";

describe("Yaml Parser", () => {
  const yaml = new Yaml();

  describe("Yaml.prototype.parse()", () => {
    it("parses YAML to JS object", () => {
      const yamlString = `
        name: John Doe
        age: 30
        email: john@example.com
        isActive: true
      `;

      const result = yaml.parse(yamlString);

      expect(result).toEqual({
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        isActive: true,
      });
    });
  });

  describe("Yaml.prototype.stringify()", () => {
    it("turns JS into YAML", () => {
      const data = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        isActive: true,
      };

      const result = yaml.stringify(data);

      expect(result).toContain("name: John Doe");
      expect(result).toContain("age: 30");
      expect(result).toContain("email: john@example.com");
      expect(result).toContain("isActive: true");
    });

    it("throws ParserError when calling stringify() with array data", () => {
      const data = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ];

      expect(() => yaml.stringify(data)).toThrow(ParserError);
    });
  });

  describe("Yaml.prototype.valid()", () => {
    it("returns false for invalid input data", () => {
      const invalidYaml = `
        name: John Doe
        age: thirty  # Invalid: should be a number
        email: invalid-email
        isActive: true
        extra: [  # Invalid: unclosed array
      `;

      expect(yaml.valid(invalidYaml)).toBe(false);
    });

    it("returns true for valid input data", () => {
      const validYaml = `
        name: John Doe
        age: 30
        email: john@example.com
      `;

      expect(yaml.valid(validYaml)).toBe(true);
    });
  });
});

describe("YAML Strategy - Zod Validation", () => {
  const yaml = new Yaml();

  it("should validate YAML data with schema", () => {
    const yamlString = `
      name: John Doe
      age: 30
      email: john@example.com
      isActive: true
    `;

    const schema = z.object({
      name: z.string(),
      age: z.number().min(0),
      email: z.string().email(),
      isActive: z.boolean().optional(),
    });

    const zodAdapter = new ZodAdapter(schema);
    const validationOptions: ValidationOptions = {
      adapter: zodAdapter,
    };

    const result = yaml.validateSchema(yamlString, validationOptions);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      isActive: true,
    });
  });

  it("should fail validation for invalid YAML schema", () => {
    const yamlString = `
      name: John Doe
      age: -5  # Invalid: age must be >= 0
      email: invalid-email  # Invalid: not a valid email
    `;

    const schema = z.object({
      name: z.string(),
      age: z.number().min(0),
      email: z.string().email(),
    });

    const zodAdapter = new ZodAdapter(schema);
    const validationOptions: ValidationOptions = {
      adapter: zodAdapter,
      throwOnError: false,
    };

    const result = yaml.validateSchema(yamlString, validationOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.issues).toHaveLength(2);
  });

  it("should validate nested YAML objects", () => {
    const yamlString = `
      user:
        profile:
          name: John Doe
          settings:
            theme: dark
            notifications: true
      metadata:
        createdAt: 2023-01-01
        source: api
    `;

    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string(),
          settings: z.object({
            theme: z.enum(["light", "dark"]),
            notifications: z.boolean(),
          }),
        }),
      }),
      metadata: z.record(z.any()).optional(),
    });

    const zodAdapter = new ZodAdapter(schema);
    const validationOptions: ValidationOptions = {
      adapter: zodAdapter,
    };

    const result = yaml.validateSchema(yamlString, validationOptions);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("user.profile.name", "John Doe");
    expect(result.data).toHaveProperty("user.profile.settings.theme", "dark");
  });
});
