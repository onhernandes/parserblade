import type { Transform } from "node:stream";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ParserError } from "../../src/errors";
import { Base } from "../../src/strategies/Base";
import type { ValidationOptions } from "../../src/types";

// Mock implementation of Base for testing validation
class MockJsonBase extends Base {
  parse(data: string): unknown {
    return JSON.parse(data);
  }

  stringify(data: unknown): string {
    return JSON.stringify(data);
  }

  pipeParse(): Transform {
    throw new Error("Not implemented for test");
  }

  pipeStringify(): Transform {
    throw new Error("Not implemented for test");
  }
}

describe("Zod Schema Validation", () => {
  const mockStrategy = new MockJsonBase();

  describe("validateSchema", () => {
    const userSchema = z.object({
      name: z.string(),
      age: z.number().min(0),
      email: z.string().email(),
      isActive: z.boolean().optional(),
    });

    it("should validate valid data successfully", () => {
      const validData = JSON.stringify({
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        isActive: true,
      });

      const validationOptions: ValidationOptions = {
        schema: userSchema,
      };

      const result = mockStrategy.validateSchema(validData, validationOptions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        isActive: true,
      });
      expect(result.error).toBeUndefined();
    });

    it("should return validation error for invalid data when throwOnError is false", () => {
      const invalidData = JSON.stringify({
        name: "John Doe",
        age: -5, // Invalid: age must be >= 0
        email: "invalid-email", // Invalid: not a valid email
      });

      const validationOptions: ValidationOptions = {
        schema: userSchema,
        throwOnError: false,
      };

      const result = mockStrategy.validateSchema(invalidData, validationOptions);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Schema validation failed");
      expect(result.error?.issues).toHaveLength(2);
      expect(result.error?.issues.find((issue) => issue.path.includes("age"))).toBeDefined();
      expect(result.error?.issues.find((issue) => issue.path.includes("email"))).toBeDefined();
    });

    it("should throw validation error for invalid data when throwOnError is true (default)", () => {
      const invalidData = JSON.stringify({
        name: "John Doe",
        age: "thirty", // Invalid: should be number
        email: "john@example.com",
      });

      const validationOptions: ValidationOptions = {
        schema: userSchema,
      };

      expect(() => {
        mockStrategy.validateSchema(invalidData, validationOptions);
      }).toThrow(ParserError);
    });

    it("should use custom error message when provided", () => {
      const invalidData = JSON.stringify({
        name: "John Doe",
        age: -1,
        email: "invalid-email",
      });

      const customErrorMessage = "Custom validation failed";
      const validationOptions: ValidationOptions = {
        schema: userSchema,
        throwOnError: false,
        errorMessage: customErrorMessage,
      };

      const result = mockStrategy.validateSchema(invalidData, validationOptions);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(customErrorMessage);
    });

    it("should handle parsing errors gracefully", () => {
      const invalidJsonData = '{"name": "John", "age": }'; // Invalid JSON

      const validationOptions: ValidationOptions = {
        schema: userSchema,
        throwOnError: false,
      };

      const result = mockStrategy.validateSchema(invalidJsonData, validationOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should validate array data", () => {
      const arraySchema = z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        }),
      );

      const validArrayData = JSON.stringify([
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ]);

      const validationOptions: ValidationOptions = {
        schema: arraySchema,
      };

      const result = mockStrategy.validateSchema(validArrayData, validationOptions);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should validate complex nested objects", () => {
      const nestedSchema = z.object({
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

      const validNestedData = JSON.stringify({
        user: {
          profile: {
            name: "John Doe",
            settings: {
              theme: "dark",
              notifications: true,
            },
          },
        },
        metadata: {
          createdAt: "2023-01-01",
          source: "api",
        },
      });

      const validationOptions: ValidationOptions = {
        schema: nestedSchema,
      };

      const result = mockStrategy.validateSchema(validNestedData, validationOptions);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("user.profile.name", "John Doe");
      expect(result.data).toHaveProperty("user.profile.settings.theme", "dark");
    });
  });

  describe("pipeValidateSchema", () => {
    const userSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it("should create a transform stream that validates data", async () => {
      const validationOptions: ValidationOptions = {
        schema: userSchema,
      };

      const stream = mockStrategy.pipeValidateSchema(validationOptions);
      const results: any[] = [];

      return new Promise<void>((resolve, reject) => {
        stream.on("data", (data) => {
          results.push(data);
        });

        stream.on("end", () => {
          try {
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ name: "John", age: 30 });
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        stream.on("error", reject);

        stream.write('{"name": "John", "age": 30}');
        stream.end();
      });
    });

    it("should emit error for invalid data when throwOnError is true", async () => {
      const validationOptions: ValidationOptions = {
        schema: userSchema,
        throwOnError: true,
      };

      const stream = mockStrategy.pipeValidateSchema(validationOptions);

      return new Promise<void>((resolve, reject) => {
        stream.on("error", (error) => {
          try {
            expect(error).toBeInstanceOf(ParserError);
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        stream.on("data", () => {
          reject(new Error("Should not emit data for invalid input"));
        });

        stream.write('{"name": "John", "age": "invalid"}');
        stream.end();
      });
    });

    it("should emit validation result for invalid data when throwOnError is false", async () => {
      const validationOptions: ValidationOptions = {
        schema: userSchema,
        throwOnError: false,
      };

      const stream = mockStrategy.pipeValidateSchema(validationOptions);
      const results: any[] = [];

      return new Promise<void>((resolve, reject) => {
        stream.on("data", (data) => {
          results.push(data);
        });

        stream.on("end", () => {
          try {
            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toBeDefined();
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        stream.on("error", reject);

        stream.write('{"name": "John", "age": "invalid"}');
        stream.end();
      });
    });

    it("should handle Buffer input", async () => {
      const validationOptions: ValidationOptions = {
        schema: userSchema,
      };

      const stream = mockStrategy.pipeValidateSchema(validationOptions);
      const results: any[] = [];

      return new Promise<void>((resolve, reject) => {
        stream.on("data", (data) => {
          results.push(data);
        });

        stream.on("end", () => {
          try {
            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ name: "Jane", age: 25 });
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        stream.on("error", reject);

        stream.write(Buffer.from('{"name": "Jane", "age": 25}'));
        stream.end();
      });
    });
  });
});
