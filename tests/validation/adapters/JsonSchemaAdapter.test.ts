import { describe, expect, it } from "vitest";
import { JsonSchemaAdapter } from "../../../src/validation/adapters/JsonSchemaAdapter";

describe("JsonSchemaAdapter", () => {
  const userSchema = {
    type: "object",
    required: ["name", "age", "email"],
    properties: {
      name: { type: "string" },
      age: { type: "number", minimum: 0 },
      email: { type: "string", format: "email" },
      isActive: { type: "boolean" },
    },
  };

  const adapter = new JsonSchemaAdapter(userSchema);

  describe("validate", () => {
    it("should validate valid data successfully", () => {
      const validData = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        isActive: true,
      };

      const result = adapter.validate(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.error).toBeUndefined();
    });

    it("should return validation error for invalid data", () => {
      const invalidData = {
        name: "John Doe",
        age: -5, // Invalid: age must be >= 0
        email: "invalid-email", // Invalid: not a valid email
      };

      const result = adapter.validate(invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Schema validation failed");
      expect(result.error?.issues).toHaveLength(2);
      expect(result.error?.issues?.[0]?.path).toContain("age");
      expect(result.error?.issues?.[1]?.path).toContain("email");
    });

    it("should validate array data", () => {
      const arraySchema = {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "number" },
            name: { type: "string" },
          },
        },
      };

      const arrayAdapter = new JsonSchemaAdapter(arraySchema);
      const validData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      const result = arrayAdapter.validate(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it("should validate complex nested objects", () => {
      const nestedSchema = {
        type: "object",
        required: ["user"],
        properties: {
          user: {
            type: "object",
            required: ["profile"],
            properties: {
              profile: {
                type: "object",
                required: ["name", "settings"],
                properties: {
                  name: { type: "string" },
                  settings: {
                    type: "object",
                    required: ["theme", "notifications"],
                    properties: {
                      theme: { type: "string", enum: ["light", "dark"] },
                      notifications: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
          metadata: {
            type: "object",
            additionalProperties: true,
          },
        },
      };

      const nestedAdapter = new JsonSchemaAdapter(nestedSchema);
      const validData = {
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
      };

      const result = nestedAdapter.validate(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });
  });
}); 