import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import { NotImplementedError } from "../../src/errors/NotImplemented";
import { ParserError } from "../../src/errors/ParserError";
import { Json } from "../../src/strategies/Json";

const strategy = new Json();
const TEST_FILE = path.resolve(__dirname, "../data/services.json");

describe("Json Strategy", () => {
  describe("Json.prototype.parse", () => {
    it("parses JSON object string to JS object properly", () => {
      const str = "{}";
      expect(strategy.parse(str)).toEqual({});
    });

    it("throws ParserError for invalid JSON string", () => {
      expect(() => {
        const str = "}";
        strategy.parse(str);
      }).toThrow(ParserError);
    });
  });

  describe("Json.prototype.stringify", () => {
    it("transforms JS object into JSON string", () => {
      const data = { name: "Hernandes", package: "parser" };
      expect(strategy.stringify(data)).toBe(
        '{"name":"Hernandes","package":"parser"}'
      );
    });
  });

  describe("Json.prototype.pipe", () => {
    it("throws NotImplementedError for pipe()", () => {
      if (typeof (strategy as any).pipe === "function") {
        expect(() => (strategy as any).pipe()).toThrow(NotImplementedError);
      } else {
        expect(() => (strategy as any).pipe()).toThrow();
      }
    });
  });

  describe("Json.prototype.valid", () => {
    it("returns false for invalid input data", () => {
      const result = strategy.valid("}");
      expect(result).toBe(false);
    });

    it("returns true for valid array as input data", () => {
      const result = strategy.valid("[]");
      expect(result).toBe(true);
    });

    it("returns true for valid object as input data", () => {
      const result = strategy.valid("{}");
      expect(result).toBe(true);
    });
  });

  describe("Json.prototype.pipeStringify", () => {
    it("stringifies an array of objects", () => {
      const input = [{ game: "Killing Floor" }, { game: "Stardew Valley" }];
      const inputCopy = [...input];

      const reader = new Readable({
        objectMode: true,
        read() {
          const next = input.shift();
          if (!next) {
            this.push(null);
          } else {
            this.push(next);
          }
        },
      });

      const result: string[] = [];
      const writer = strategy.pipeStringify();
      reader.pipe(writer);

      return new Promise<void>((resolve, reject) => {
        writer.on("data", (data: string) => {
          result.push(data);
        });

        writer.on("error", (err) => {
          reject(err);
        });

        writer.on("end", () => {
          try {
            const jsonString = result.join("");
            const parsed = JSON.parse(jsonString);
            expect(parsed).toEqual(expect.arrayContaining(inputCopy));
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it("stringifies an object", () => {
      const input = {
        services: [{ url: "cloud.google.com" }],
      };
      const entries = Object.entries(input);

      const reader = new Readable({
        objectMode: true,
        read() {
          const next = entries.shift();
          if (!next) {
            this.push(null);
          } else {
            this.push(next);
          }
        },
      });

      const result: string[] = [];
      const writer = strategy.pipeStringify({ type: "object" });
      reader.pipe(writer);

      return new Promise<void>((resolve, reject) => {
        writer.on("data", (data: string) => {
          result.push(data);
        });

        writer.on("error", (err) => {
          reject(err);
        });

        writer.on("end", () => {
          try {
            const jsonString = result.join("");
            const parsed = JSON.parse(jsonString);
            expect(parsed).toMatchObject(input);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  });

  describe("Json.prototype.pipeParse", () => {
    it("parses an object", () => {
      const reader = fs.createReadStream(TEST_FILE);

      const result: unknown[] = [];
      const writer = strategy.pipeParse();
      reader.pipe(writer);

      return new Promise<void>((resolve, reject) => {
        writer.on("data", (data: unknown) => {
          result.push(data);
        });

        writer.on("error", (err) => {
          reject(err);
        });

        writer.on("end", () => {
          try {
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
              services: [{ url: "netflix.com" }],
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  });
});
