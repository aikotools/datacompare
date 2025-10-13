import { describe, it } from 'vitest';
import { compareData } from '../../src';

describe('Debug Test', () => {
  it('debug endsWith', async () => {
    const result = await compareData({
      expected: { email: '{{compare:endsWith:@example.com}}' },
      actual: { email: 'john.doe@example.com' },
    });

    console.log('Result:', JSON.stringify(result, null, 2));
  });

  it('debug regex', async () => {
    const result = await compareData({
      expected: { userId: '{{compare:regex:user_\\d{5}}}' },
      actual: { userId: 'user_12345' },
    });

    console.log('Result:', JSON.stringify(result, null, 2));
  });
});
