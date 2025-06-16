import { Parser } from '../src/Parser';
import { IStrategy } from '../src/types';
import { Transform } from 'stream';

describe('Parser implements Strategy', () => {
  const createMockStrategy = (overrides: Partial<IStrategy> = {}): IStrategy => ({
    parse: jest.fn(),
    stringify: jest.fn(),
    valid: jest.fn(),
    pipeParse: jest.fn(() => new Transform()),
    pipeStringify: jest.fn(() => new Transform()),
    ...overrides,
  });

  it('calls parse() strategy method', () => {
    const mockStrategy = createMockStrategy();
    const parser = new Parser(mockStrategy);
    const testData = '{"test": "data"}';
    parser.parse(testData);
    expect(mockStrategy.parse).toHaveBeenCalledWith(testData, undefined);
  });

  it('calls stringify() strategy method', () => {
    const mockStrategy = createMockStrategy();
    const parser = new Parser(mockStrategy);
    const testData = { test: 'data' };
    parser.stringify(testData);
    expect(mockStrategy.stringify).toHaveBeenCalledWith(testData, undefined);
  });

  it('calls valid() strategy method', () => {
    const mockStrategy = createMockStrategy();
    const parser = new Parser(mockStrategy);
    const testData = '{"test": "data"}';
    parser.valid(testData);
    expect(mockStrategy.valid).toHaveBeenCalledWith(testData, undefined);
  });

  it('calls pipeStringify() strategy method', () => {
    const mockStrategy = createMockStrategy();
    const parser = new Parser(mockStrategy);
    parser.pipeStringify();
    expect(mockStrategy.pipeStringify).toHaveBeenCalled();
  });

  it('calls pipeParse() strategy method', () => {
    const mockStrategy = createMockStrategy();
    const parser = new Parser(mockStrategy);
    parser.pipeParse();
    expect(mockStrategy.pipeParse).toHaveBeenCalled();
  });
});
