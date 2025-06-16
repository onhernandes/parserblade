import { NotImplementedError } from "../../src/errors/NotImplemented";
import { ParserError } from "../../src/errors/ParserError";
import { Yaml } from "../../src/strategies/Yaml";

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
