import { Readable } from 'stream';
import { NotImplementedError } from '../../src/errors/NotImplemented';
import { ParserError } from '../../src/errors/ParserError';
import { Xml } from '../../src/strategies/Xml';
import { XmlDeclaration, XmlTag } from '../../src/strategies/XmlTag';

const strategy = new Xml();

const input = `
<?xml version="1.0" encoding="utf-8"?>
<games>
  <name>Naruto Shippuden Storm 3</name>
  <platform>
    platform
    <another>
      This is another tag
    </another>
    <another>
      Third tag another
    </another>
  </platform>
  <site url="netflix">
    Netflix
    <description>
      Possible description here
    </description>
  </site>
</games>
`.split('');

interface ReadableOptions {
  objectMode?: boolean;
}

const getReader = (inputArray: string[], options: ReadableOptions = {}) =>
  new Readable({
    objectMode: !!options.objectMode,
    read() {
      const next = inputArray.shift();
      if (next) {
        this.push(next);
      } else {
        this.push(null);
      }
    },
  });

describe('Xml Strategy', () => {
  describe('Xml.prototype.setXmlDeclaration()', () => {
    it('puts XML declaration on first position within array', () => {
      const data = [{ language: 'nodejs' }];
      const result = (strategy as any).setXmlDeclaration(data);
      expect(result[0]).toEqual((strategy as any).XML_VERSION_TAG);
    });

    it('puts XML declaration on first position within object', () => {
      const data = { language: 'nodejs' };
      const result = (strategy as any).setXmlDeclaration(data);
      const keys = Object.keys(result);
      expect(keys[0]).toEqual('_declaration');
    });
  });

  describe('Xml.prototype.stringify()', () => {
    it('transforms JS object into Xml string', () => {
      const data = { game: 'Stardew Valley' };
      const expected = '<?xml version="1.0" encoding="utf-8"?><game>Stardew Valley</game>';
      expect(strategy.stringify(data)).toBe(expected);
    });

    it('transforms JS object into XML string without xml version', () => {
      const data = { game: 'Stardew Valley' };
      const expected = '<game>Stardew Valley</game>';
      const result = strategy.stringify(data, { ignoreDeclaration: true });
      expect(result).toBe(expected);
    });

    it('transforms JS array into XML string', () => {
      const data = {
        packages: [{ name: 'lodash' }],
      };
      const expected =
        '<?xml version="1.0" encoding="utf-8"?><packages><name>lodash</name></packages>';
      const result = strategy.stringify(data);
      expect(result).toBe(expected);
    });
  });

  describe('Xml.prototype.parse()', () => {
    it('parses XML string to JS object in verbose mode', () => {
      const data =
        '<?xml version="1.0" encoding="utf-8"?><games><name>Naruto Shippuden Storm 3</name><platform>playstation</platform></games>';
      const expected = {
        elements: [
          {
            type: 'element',
            name: 'games',
            elements: [
              {
                type: 'element',
                name: 'name',
                elements: [
                  {
                    type: 'text',
                    text: 'Naruto Shippuden Storm 3',
                  },
                ],
              },
              {
                type: 'element',
                name: 'platform',
                elements: [
                  {
                    type: 'text',
                    text: 'playstation',
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = strategy.parse(data, { verbose: true });
      expect(result).toStrictEqual(expected);
    });

    it('parses XML string to JS object', () => {
      const data =
        '<?xml version="1.0" encoding="utf-8"?><games><name>Naruto Shippuden Storm 3</name><platform>playstation</platform></games>';
      const expected = {
        games: {
          name: { _text: 'Naruto Shippuden Storm 3' },
          platform: { _text: 'playstation' },
        },
      };
      const result = strategy.parse(data);
      expect(result).toStrictEqual(expected);
    });

    it('parses XML string to JS object array', () => {
      const data =
        '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>';
      const expected = {
        packages: {
          name: [{ _text: 'mongoose' }, { _text: 'sequelize' }],
        },
      };
      const result = strategy.parse(data);
      expect(result).toStrictEqual(expected);
    });

    it('throws ParserError for missing parent tag', () => {
      const data =
        '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>';
      expect(() => {
        strategy.parse(data);
      }).not.toThrow(ParserError);
    });

    it('parses XML string, including _declaration', () => {
      const data =
        '<?xml version="1.0" encoding="utf-8"?><packages><name>mongoose</name><name>sequelize</name></packages>';
      const expected = {
        _declaration: {
          _attributes: {
            encoding: 'utf-8',
            version: 1,
          },
        },
        packages: {
          name: [{ _text: 'mongoose' }, { _text: 'sequelize' }],
        },
      };
      const result = strategy.parse(data, { showDeclaration: true });
      expect(result).toStrictEqual(expected);
    });
  });

  describe('Xml.prototype.pipe()', () => {
    it('throws NotImplementedError for pipe()', () => {
      if (typeof (strategy as any).pipe === 'function') {
        expect(() => (strategy as any).pipe()).toThrow(NotImplementedError);
      } else {
        expect(() => (strategy as any).pipe()).toThrow();
      }
    });
  });

  describe('Xml.prototype.valid()', () => {
    it('returns false for invalid input data', () => {
      const result = strategy.valid('phrase<tag />');
      expect(result).toBe(false);
    });

    it('returns true for valid input data', () => {
      const result = strategy.valid('<game>Stardew Valley</game>');
      expect(result).toBe(true);
    });
  });

  describe.skip('Xml.prototype.pipeParse', () => {
    it('parses with default options.depth', (done) => {
      const reader = getReader(Array.from(input));
      const toExpected: Record<string, (data: any) => void> = {
        declaration: (data: XmlDeclaration) => {
          expect(data).toBeInstanceOf(XmlDeclaration);
          expect(data.version).toEqual('1.0');
          expect(data.encoding).toEqual('utf-8');
        },
        games: (data: XmlTag) => {
          expect(data).toBeInstanceOf(XmlTag);
          expect(data.tags).toHaveLength(3);
        },
      };

      let processedCount = 0;
      const expectedCount = Object.keys(toExpected).length;

      reader
        .pipe(strategy.pipeParse())
        .on('data', (data: any) => {
          const handler = toExpected[data.name];
          if (handler) {
            handler(data);
            processedCount++;
            if (processedCount === expectedCount) {
              done();
            }
          }
        })
        .on('error', done)
        .on('end', () => {
          if (processedCount < expectedCount) {
            done();
          }
        });
    });

    it('parses with custom options.depth 1', (done) => {
      const reader = getReader(Array.from(input));
      const toExpected: Record<string, (data: any) => void> = {
        declaration: (data: XmlDeclaration) => {
          expect(data).toBeInstanceOf(XmlDeclaration);
          expect(data.version).toEqual('1.0');
          expect(data.encoding).toEqual('utf-8');
        },
        name: (data: XmlTag) => {
          expect(data).toBeInstanceOf(XmlTag);
          expect(data.tags).toHaveLength(0);
        },
        platform: (data: XmlTag) => {
          expect(data).toBeInstanceOf(XmlTag);
          expect(data.tags).toHaveLength(2);
        },
        site: (data: XmlTag) => {
          expect(data).toBeInstanceOf(XmlTag);
          expect(data.tags).toHaveLength(1);
        },
      };

      let processedCount = 0;
      const expectedCount = Object.keys(toExpected).length;

      reader
        .pipe(strategy.pipeParse({ depth: 1 }))
        .on('data', (data: any) => {
          const handler = toExpected[data.name];
          if (handler) {
            handler(data);
            processedCount++;
            if (processedCount === expectedCount) {
              done();
            }
          }
        })
        .on('error', done)
        .on('end', () => {
          if (processedCount < expectedCount) {
            done();
          }
        });
    });
  });

  describe.skip('Xml.prototype.pipeStringify', () => {
    it('stringifies an array of object', (done) => {
      const objectData = {
        games: 'none',
      };

      const contents = [objectData, objectData];
      const reader = getReader(contents as any[], { objectMode: true });

      const expected =
        strategy.stringify(objectData) +
        strategy.stringify(objectData, { ignoreDeclaration: true });
      let parsed = '';

      reader
        .pipe(strategy.pipeStringify())
        .on('data', (data: string) => {
          parsed = parsed + data;
        })
        .on('error', done)
        .on('end', () => {
          try {
            expect(parsed).toBe(expected);
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('stringifies an array of object with custom parent', (done) => {
      const objectData = {
        games: 'none',
      };

      const contents = [objectData, objectData];
      const reader = getReader(contents as any[], { objectMode: true });

      const expected =
        '<?xml version="1.0" encoding="utf-8"?><my-games>All my games<games>none</games><games>none</games></my-games>';

      const mainTag = {
        name: 'my-games',
        text: 'All my games',
      };
      let parsed = '';

      reader
        .pipe(strategy.pipeStringify({ mainTag }))
        .on('data', (data: string) => {
          parsed = parsed + data;
        })
        .on('error', done)
        .on('end', () => {
          try {
            expect(parsed).toBe(expected);
            done();
          } catch (err) {
            done(err);
          }
        });
    });
  });
});
