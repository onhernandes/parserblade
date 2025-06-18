import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodAdapter } from "../../../src/validation/adapters/ZodAdapter";

describe("ZodAdapter", () => {
  const userSchema = z.object({
    name: z.string(),
    age: z.number().min(0),
    email: z.string().email(),
    isActive: z.boolean().optional(),
  });

  const adapter = new ZodAdapter(userSchema);

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
      expect(result.error?.issues?.[0]?.path).toEqual(["age"]);
      expect(result.error?.issues?.[1]?.path).toEqual(["email"]);
    });

    it("should validate array data", () => {
      const arraySchema = z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        }),
      );

      const arrayAdapter = new ZodAdapter(arraySchema);
      const validData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      const result = arrayAdapter.validate(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
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

      const nestedAdapter = new ZodAdapter(nestedSchema);
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