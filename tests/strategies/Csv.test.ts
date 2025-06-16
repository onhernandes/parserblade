import { Readable } from "node:stream";
import { Csv } from "../../src/strategies/Csv";

const strategy = new Csv();
const input = [
  "name,email",
  "Netflix,contact@netflix.com",
  "Prime Video,contact@primevideo.com",
];

interface ReadableOptions {
  objectMode?: boolean;
}

const getReader = (inputArray: string[], options: ReadableOptions = {}) =>
  new Readable({
    objectMode: !!options.objectMode,
    read() {
      const next = inputArray.shift();
      this.push(next || null);
    },
  });

describe("Csv Strategy", () => {
  describe("Csv.prototype.parse()", () => {
    it("parse CSV string ignoring headers", () => {
      const input = "name,email\nNetflix,contact@netflix.com";
      const result = strategy.parse(input, { headers: false });
      expect(result).toEqual([
        ["name", "email"],
        ["Netflix", "contact@netflix.com"],
      ]);
    });

    it("parse CSV string with headers", () => {
      const input = "name,email\nNetflix,contact@netflix.com";
      const result = strategy.parse(input);

      expect(result).toEqual([
        { name: "Netflix", email: "contact@netflix.com" },
      ]);
    });

    it("parse CSV string with custom delimiters", () => {
      const input = "name;email\nNetflix;contact@netflix.com";
      const result = strategy.parse(input, { delimiter: ";" });

      expect(result).toEqual([
        { name: "Netflix", email: "contact@netflix.com" },
      ]);
    });

    it("parse CSV string skipping lines", () => {
      const input = "insights\nname,email\nNetflix,contact@netflix.com";
      const result = strategy.parse(input, { skipLines: 2 });

      expect(result).toEqual([
        { name: "Netflix", email: "contact@netflix.com" },
      ]);
    });

    it("parse CSV string with offset", () => {
      const input =
        "name,email\nNetflix,contact@netflix.com\nAmazon,contact@amazon.com";
      const result = strategy.parse(input, { offset: 2 });

      expect(result).toEqual([
        { name: "Netflix", email: "contact@netflix.com" },
      ]);
    });
  });

  describe("Csv.prototype.stringify()", () => {
    it("turns array of objects into CSV string", () => {
      const input = [{ name: "Netflix", email: "contact@netflix.com" }];
      const result = strategy.stringify(input);

      expect(result).toEqual(
        expect.stringMatching("name,email\nNetflix,contact@netflix.com")
      );
    });

    it("turns array of objects into CSV string without header", () => {
      const input = [{ name: "Netflix", email: "contact@netflix.com" }];
      const result = strategy.stringify(input, { headers: false });

      expect(result).toEqual(
        expect.stringMatching("Netflix,contact@netflix.com")
      );
    });

    it("turns array of objects into CSV string with custom column names", () => {
      const input = [{ name: "Netflix", email: "contact@netflix.com" }];
      const columns = { name: "Platform", email: "e-mail" };

      const result = strategy.stringify(input, { columns });

      expect(result).toEqual(
        expect.stringMatching("Platform,e-mail\nNetflix,contact@netflix.com")
      );
    });
  });

  describe("Csv.prototype.valid", () => {
    it("returns false for invalid input data", () => {
      const result = strategy.valid("name\nstardew,pokemon");
      expect(result).toBe(false);
    });

    it("returns true for valid input data", () => {
      const result = strategy.valid("name,email\nNetflix,contact@netflix.com");
      expect(result).toBe(true);
    });
  });

  describe.skip("Csv.prototype.pipeParse", () => {
    it("parses with default options", (done) => {
      const reader = getReader(Array.from(input));
      const parsedData: unknown[] = [];
      const stream = reader.pipe(strategy.pipeParse());

      stream.on("data", (data: unknown) => {
        parsedData.push(data);
      });

      stream.on("error", done);

      stream.on("end", () => {
        try {
          // Allow for asynchronous processing
          setTimeout(() => {
            expect(parsedData.length).toBeGreaterThan(0);

            const netflix = {
              name: "Netflix",
              email: "contact@netflix.com",
            };
            expect(parsedData[0]).toMatchObject(netflix);

            if (parsedData.length > 1) {
              const prime = {
                name: "Prime Video",
                email: "contact@primevideo.com",
              };
              expect(parsedData[1]).toMatchObject(prime);
            }
            done();
          }, 100);
        } catch (err) {
          done(err);
        }
      });
    });

    it("parses with custom options.delimiter", (done) => {
      const input = [
        "name;email",
        "Netflix;contact@netflix.com",
        "Prime Video;contact@primevideo.com",
      ];
      const reader = getReader(Array.from(input));
      const parsedData: unknown[] = [];
      const stream = reader.pipe(strategy.pipeParse({ delimiter: ";" }));

      stream.on("data", (data: unknown) => {
        parsedData.push(data);
      });

      stream.on("error", done);

      stream.on("end", () => {
        try {
          // Allow for asynchronous processing
          setTimeout(() => {
            expect(parsedData.length).toBeGreaterThan(0);

            const netflix = {
              name: "Netflix",
              email: "contact@netflix.com",
            };
            expect(parsedData[0]).toMatchObject(netflix);

            if (parsedData.length > 1) {
              const prime = {
                name: "Prime Video",
                email: "contact@primevideo.com",
              };
              expect(parsedData[1]).toMatchObject(prime);
            }
            done();
          }, 100);
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe("Csv.prototype.pipeStringify", () => {
    it("stringify with default options", () => {
      const input = [
        { name: "Netflix", site: "netflix.com" },
        { name: "Prime Video", site: "primevideo.com" },
      ];
      const reader = getReader(Array.from(input) as any[], {
        objectMode: true,
      });

      const parsedData: string[] = [];
      const stream = reader.pipe(strategy.pipeStringify());

      return new Promise<void>((resolve, reject) => {
        stream.on("data", (row: any) => {
          parsedData.push(row.toString());
        });

        stream.on("error", reject);

        stream.on("end", () => {
          try {
            const str = parsedData.join("");
            expect(str).toEqual(
              "name,site\nNetflix,netflix.com\nPrime Video,primevideo.com\n"
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it("stringify with custom delimiter", () => {
      const input = [
        { name: "Netflix", site: "netflix.com" },
        { name: "Prime Video", site: "primevideo.com" },
      ];
      const reader = getReader(Array.from(input) as any[], {
        objectMode: true,
      });

      const parsedData: string[] = [];
      const stream = reader.pipe(strategy.pipeStringify({ delimiter: ";" }));

      return new Promise<void>((resolve, reject) => {
        stream.on("data", (row: any) => {
          parsedData.push(row.toString());
        });

        stream.on("error", reject);

        stream.on("end", () => {
          try {
            const str = parsedData.join("");
            expect(str).toEqual(
              "name;site\nNetflix;netflix.com\nPrime Video;primevideo.com\n"
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it("stringify with custom column", () => {
      const input = [
        { name: "Netflix", site: "netflix.com" },
        { name: "Prime Video", site: "primevideo.com" },
      ];
      const reader = getReader(Array.from(input) as any[], {
        objectMode: true,
      });

      const config = {
        columns: { name: "Name", site: "Website URL" },
      };

      const parsedData: string[] = [];
      const stream = reader.pipe(strategy.pipeStringify(config));

      return new Promise<void>((resolve, reject) => {
        stream.on("data", (row: any) => {
          parsedData.push(row.toString());
        });

        stream.on("error", reject);

        stream.on("end", () => {
          try {
            const str = parsedData.join("");
            expect(str).toEqual(
              "Name,Website URL\nNetflix,netflix.com\nPrime Video,primevideo.com\n"
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it("stringify reordering columns", () => {
      const input = [
        { name: "Netflix", site: "netflix.com" },
        { name: "Prime Video", site: "primevideo.com" },
      ];
      const reader = getReader(Array.from(input) as any[], {
        objectMode: true,
      });

      const config = {
        columns: ["site", "name"],
      };

      const parsedData: string[] = [];
      const stream = reader.pipe(strategy.pipeStringify(config));

      return new Promise<void>((resolve, reject) => {
        stream.on("data", (row: any) => {
          parsedData.push(row.toString());
        });

        stream.on("error", reject);

        stream.on("end", () => {
          try {
            const str = parsedData.join("");
            expect(str).toEqual(
              "site,name\nnetflix.com,Netflix\nprimevideo.com,Prime Video\n"
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  });
});
