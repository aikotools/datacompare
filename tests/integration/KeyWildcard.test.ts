import { describe, it, expect } from 'vitest'
import { createDefaultEngine } from '../../src/index'

/**
 * The key wildcard in an expectation.
 *
 * A protobuf map is keyed by an id the sender assigns. An expectation that names that id ties
 * itself to a number the consumer does not control. `'*'` as a key says "every entry here
 * looks like this", whatever it is called.
 */

const context = {
  startTimeScript: '2026-10-09T08:00:00.000Z',
  startTimeTest: '2026-10-09T08:00:00.000Z',
}

async function compare(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
) {
  const engine = createDefaultEngine()
  return engine.compare({ expected, actual, context, options })
}

describe('key wildcard', () => {
  it('matches an entry whose key the expectation does not know', async () => {
    const result = await compare(
      { reasons: { '*': { code: '3', text: 'fire brigade' } } },
      { reasons: { '7': { code: '3', text: 'fire brigade' } } }
    )

    expect(result.success).toBe(true)
  })

  it('reports the mismatch under the real key, not under the wildcard', async () => {
    const result = await compare(
      { reasons: { '*': { code: '3' } } },
      { reasons: { '7': { code: '31' } } }
    )

    expect(result.success).toBe(false)
    expect(result.errors[0].path).toBe('reasons.7.code')
  })

  it('fails when there is no entry at all', async () => {
    const result = await compare({ reasons: { '*': { code: '3' } } }, { reasons: {} })

    expect(result.success).toBe(false)
    expect(result.errors[0].type).toBe('MISSING_PROPERTY')
    expect(result.errors[0].path).toBe('reasons.*')
  })

  it('requires every covered entry to match', async () => {
    const result = await compare(
      { reasons: { '*': { code: '3' } } },
      { reasons: { '7': { code: '3' }, '9': { code: '31' } } }
    )

    expect(result.success).toBe(false)
    expect(result.errors.some((e) => e.path === 'reasons.9.code')).toBe(true)
  })

  it('does not count covered entries as extra properties', async () => {
    const result = await compare(
      { reasons: { '*': { code: '3' } } },
      { reasons: { '7': { code: '3' } } },
      { ignoreExtraProperties: false }
    )

    expect(result.success).toBe(true)
  })

  it('lets concrete keys win and covers the rest with the wildcard', async () => {
    const result = await compare(
      { reasons: { '1': { code: '31' }, '*': { code: '3' } } },
      { reasons: { '1': { code: '31' }, '5': { code: '3' }, '6': { code: '3' } } }
    )

    expect(result.success).toBe(true)
  })

  it('still reports a concrete key that is missing', async () => {
    const result = await compare(
      { reasons: { '1': { code: '31' }, '*': { code: '3' } } },
      { reasons: { '5': { code: '3' } } }
    )

    expect(result.success).toBe(false)
    expect(result.errors.some((e) => e.path === 'reasons.1')).toBe(true)
  })

  it('works together with ignorePaths on a field of the entry', async () => {
    const result = await compare(
      { reasons: { '*': { messageId: 1, code: '3' } } },
      { reasons: { '9': { messageId: 9, code: '3' } } },
      { ignorePaths: [{ path: ['reasons', '*', 'messageId'], doc: ['assigned by the sender'] }] }
    )

    expect(result.success).toBe(true)
  })

  it('leaves objects without a wildcard untouched', async () => {
    const passt = await compare({ a: 1 }, { a: 1, b: 2 })
    expect(passt.success).toBe(true)

    const fehlt = await compare({ a: 1 }, { b: 2 })
    expect(fehlt.success).toBe(false)
    expect(fehlt.errors[0].type).toBe('MISSING_PROPERTY')
  })
})
