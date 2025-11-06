import { describe, it, expect } from 'vitest';
import { compareData } from '../../src';

describe('Basic Comparison', () => {
  it('should compare simple objects', async () => {
    const result = await compareData({
      expected: { name: 'John', age: 30 },
      actual: { name: 'John', age: 30 },
    });

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect value mismatch', async () => {
    const result = await compareData({
      expected: { name: 'John', age: 30 },
      actual: { name: 'Jane', age: 30 },
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe('name');
  });

  it('should ignore extra properties by default', async () => {
    const result = await compareData({
      expected: { name: 'John' },
      actual: { name: 'John', age: 30, email: 'john@example.com' },
    });

    expect(result.success).toBe(true);
  });

  it('should handle arrays', async () => {
    const result = await compareData({
      expected: [1, 2, 3],
      actual: [1, 2, 3],
    });

    expect(result.success).toBe(true);
  });

  it('should detect array length mismatch', async () => {
    const result = await compareData({
      expected: [1, 2, 3],
      actual: [1, 2],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('should support {{compare:ignore}} directive', async () => {
    const result = await compareData({
      expected: { name: 'John', timestamp: '{{compare:ignore}}' },
      actual: { name: 'John', timestamp: '2023-12-01T10:30:00Z' },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:ignoreRest}} in arrays', async () => {
    const result = await compareData({
      expected: [1, 2, '{{compare:ignoreRest}}'],
      actual: [1, 2, 3, 4, 5],
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:ignoreOrder}} in arrays', async () => {
    const result = await compareData({
      expected: ['{{compare:ignoreOrder}}', 'apple', 'banana', 'cherry'],
      actual: ['cherry', 'apple', 'banana'],
    });

    expect(result.success).toBe(true);
  });
});

describe('String Pattern Directives', () => {
  it('should support {{compare:startsWith}} directive', async () => {
    const result = await compareData({
      expected: { message: '{{compare:startsWith:Hello}}' },
      actual: { message: 'Hello World' },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:endsWith}} directive', async () => {
    const result = await compareData({
      expected: { email: '{{compare:endsWith:@example.com}}' },
      actual: { email: 'john.doe@example.com' },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:regex}} directive', async () => {
    const result = await compareData({
      expected: { userId: '{{compare:regex:user_[0-9]{5}}}' },
      actual: { userId: 'user_12345' },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:contains}} directive', async () => {
    const result = await compareData({
      expected: { log: '{{compare:contains:ERROR}}' },
      actual: { log: '[2023-12-01] ERROR: Something went wrong' },
    });

    expect(result.success).toBe(true);
  });
});

describe('Time Range Directives', () => {
  it('should support {{compare:time:range}} with combined range', async () => {
    const now = new Date().toISOString();

    const result = await compareData({
      expected: { timestamp: '{{compare:time:range:-300:+300:seconds}}' },
      actual: { timestamp: now },
      context: { startTimeTest: now },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:time:range}} with future only', async () => {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 30 * 1000).toISOString(); // 30 seconds in future

    const result = await compareData({
      expected: { timestamp: '{{compare:time:range:+60:seconds}}' },
      actual: { timestamp: future },
      context: { startTimeTest: now },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:time:range}} with past only', async () => {
    const now = new Date().toISOString();
    const past = new Date(Date.now() - 30 * 1000).toISOString(); // 30 seconds in past

    const result = await compareData({
      expected: { timestamp: '{{compare:time:range:-60:seconds}}' },
      actual: { timestamp: past },
      context: { startTimeTest: now },
    });

    expect(result.success).toBe(true);
  });

  it('should detect time outside range', async () => {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes in future

    const result = await compareData({
      expected: { timestamp: '{{compare:time:range:-60:+60:seconds}}' },
      actual: { timestamp: future },
      context: { startTimeTest: now },
    });

    expect(result.success).toBe(false);
  });

  it('should support {{compare:time:exact}} without offset', async () => {
    const baseTime = '2025-11-05T15:30:00+01:00';

    const result = await compareData({
      expected: { timestamp: '{{compare:time:exact}}' },
      actual: { timestamp: baseTime },
      context: { startTimeTest: baseTime },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:time:exact}} with offset in seconds', async () => {
    const baseTime = '2025-11-05T15:30:00+01:00';
    const actualTime = '2025-11-05T15:40:30+01:00'; // baseTime + 630 seconds

    const result = await compareData({
      expected: { abfahrt: '{{compare:time:exact:630:seconds}}' },
      actual: { abfahrt: actualTime },
      context: { startTimeTest: baseTime },
    });

    expect(result.success).toBe(true);
  });

  it('should support {{compare:time:exact}} with offset in minutes', async () => {
    const baseTime = '2025-11-05T15:30:00+01:00';
    const actualTime = '2025-11-05T15:45:00+01:00'; // baseTime + 15 minutes

    const result = await compareData({
      expected: { timestamp: '{{compare:time:exact:15:minutes}}' },
      actual: { timestamp: actualTime },
      context: { startTimeTest: baseTime },
    });

    expect(result.success).toBe(true);
  });

  it('should detect time mismatch with exact offset', async () => {
    const baseTime = '2025-11-05T15:30:00+01:00';
    const actualTime = '2025-11-05T15:45:00+01:00'; // baseTime + 15 minutes

    const result = await compareData({
      expected: { timestamp: '{{compare:time:exact:10:minutes}}' }, // expects 10 minutes
      actual: { timestamp: actualTime }, // but actual is 15 minutes
      context: { startTimeTest: baseTime },
    });

    expect(result.success).toBe(false);
    expect(result.errors[0].message).toContain('Time mismatch');
  });

  it('should support negative offset (time in the past)', async () => {
    const baseTime = '2025-11-05T15:30:00+01:00';
    const actualTime = '2025-11-05T15:20:00+01:00'; // baseTime - 10 minutes

    const result = await compareData({
      expected: { timestamp: '{{compare:time:exact:-10:minutes}}' },
      actual: { timestamp: actualTime },
      context: { startTimeTest: baseTime },
    });

    expect(result.success).toBe(true);
  });
});

describe('Number Range Directives', () => {
  it('should support {{compare:number:range}} directive', async () => {
    const result = await compareData({
      expected: { score: '{{compare:number:range:0:100}}' },
      actual: { score: 85 },
    });

    expect(result.success).toBe(true);
  });

  it('should detect number outside range', async () => {
    const result = await compareData({
      expected: { score: '{{compare:number:range:0:100}}' },
      actual: { score: 150 },
    });

    expect(result.success).toBe(false);
  });

  it('should support {{compare:number:tolerance}} directive', async () => {
    const result = await compareData({
      expected: { value: '{{compare:number:tolerance:42:±5}}' },
      actual: { value: 44 },
    });

    expect(result.success).toBe(true);
  });

  it('should support percentage tolerance', async () => {
    const result = await compareData({
      expected: { value: '{{compare:number:tolerance:100:±10%}}' },
      actual: { value: 95 },
    });

    expect(result.success).toBe(true);
  });
});
