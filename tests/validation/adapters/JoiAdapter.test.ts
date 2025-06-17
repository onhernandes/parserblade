import { describe, expect, it } from "vitest";
import Joi from "joi";
import { JoiAdapter } from "../../../src/validation/adapters/JoiAdapter";

describe("JoiAdapter", () => {
  const userSchema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().min(0).required(),
    email: Joi.string().email().required(),
    isActive: Joi.boolean().optional(),
  });

  const adapter = new JoiAdapter(userSchema);

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
      const arraySchema = Joi.array().items(
        Joi.object({
          id: Joi.number().required(),
          name: Joi.string().required(),
        }),
      );

      const arrayAdapter = new JoiAdapter(arraySchema);
      const validData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      const result = arrayAdapter.validate(validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it("should validate complex nested objects", () => {
      const nestedSchema = Joi.object({
        user: Joi.object({
          profile: Joi.object({
            name: Joi.string().required(),
            settings: Joi.object({
              theme: Joi.string().valid("light", "dark").required(),
              notifications: Joi.boolean().required(),
            }).required(),
          }).required(),
        }).required(),
        metadata: Joi.object().optional(),
      });

      const nestedAdapter = new JoiAdapter(nestedSchema);
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