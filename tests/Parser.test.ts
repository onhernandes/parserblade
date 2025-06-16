import { Transform } from 'stream';
import { describe, expect, it, vi } from 'vitest';
import { Parser } from '../src/Parser';
import type { BaseStrategyProps } from '../src/types';

describe('Parser implements Strategy', () => {
  const createMockStrategy = (overrides: Partial<BaseStrategyProps> = {}): BaseStrategyProps => ({
    parse: vi.fn(),
    stringify: vi.fn(),
    valid: vi.fn(),
    pipeParse: vi.fn(() => new Transform()),
    pipeStringify: vi.fn(() => new Transform()),
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
