import { NotImplementedError } from "../../src/errors/NotImplemented";
import { Base } from "../../src/strategies/Base";

class TestImplementation extends Base {
  // This class intentionally doesn't implement the Base methods
  // to test that they throw NotImplementedError
}

const instance = new TestImplementation();

describe("Base Strategy implementation", () => {
  it("throws NotImplementedError for stringify() method", () => {
    expect(() => instance.stringify({})).toThrow(NotImplementedError);
  });

  it("throws NotImplementedError for parse() method", () => {
    expect(() => instance.parse("")).toThrow(NotImplementedError);
  });

  it("throws NotImplementedError for pipeParse() method", () => {
    expect(() => instance.pipeParse()).toThrow(NotImplementedError);
  });

  it("throws NotImplementedError for pipeStringify() method", () => {
    expect(() => instance.pipeStringify()).toThrow(NotImplementedError);
  });

  /*
  it('throws NotImplementedError for valid() method, because parse() is not implemented', () => {
    expect(() => instance.valid('')).toThrow(NotImplementedError);
  });
  */
});
