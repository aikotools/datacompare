import { describe, it } from 'vitest';
import { compareData, CompareParser } from '../../src';

describe('Regex Debug', () => {
  it('test parser', () => {
    const parser = new CompareParser();

    const test1 = '{{compare:regex:user_\\d{5}}}';
    console.log('test1:', test1);
    console.log('isDirective:', parser.isDirective(test1));

    if (parser.isDirective(test1)) {
      const parsed = parser.parse(test1);
      console.log('parsed:', JSON.stringify(parsed, null, 2));
    }
  });

  it('test with different escaping', async () => {
    // Try with single backslash (might need raw string)
    const result1 = await compareData({
      expected: { userId: '{{compare:regex:user_[0-9]{5}}}' },
      actual: { userId: 'user_12345' },
    });
    console.log('Result1 (no backslash):', result1.success);

    // Try with proper regex
    const result2 = await compareData({
      expected: { userId: '{{compare:regex:user_\\d{5}}}' },
      actual: { userId: 'user_12345' },
    });
    console.log('Result2 (with \\d):', result2.success);
    if (!result2.success) {
      console.log('Errors:', result2.errors);
    }
  });
});
