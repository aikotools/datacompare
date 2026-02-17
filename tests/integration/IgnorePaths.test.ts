import { describe, it, expect } from 'vitest'
import { compareData } from '../../src'

describe('IgnorePaths', () => {
  it('should ignore an exact path match', async () => {
    const result = await compareData({
      expected: { name: 'John', secret: 'expectedValue' },
      actual: { name: 'John', secret: 'completelyDifferent' },
      options: {
        ignorePaths: [{ path: ['secret'], doc: ['Secret field ignored for testing'] }]
      }
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const ignoredDetail = result.details.find(d => d.path === 'secret')
    expect(ignoredDetail).toBeDefined()
    expect(ignoredDetail?.message).toContain('Ignored by ignorePath')
  })

  it('should ignore a nested path match', async () => {
    const result = await compareData({
      expected: { data: { info: { status: 'active' } } },
      actual: { data: { info: { status: 'inactive' } } },
      options: {
        ignorePaths: [{ path: ['data', 'info', 'status'], doc: ['Status ignored'] }]
      }
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should ignore a subtree when ignorePath is shorter than actual path', async () => {
    const result = await compareData({
      expected: {
        data: {
          nested: {
            deep: 'expectedValue',
            another: 42
          }
        }
      },
      actual: {
        data: {
          nested: {
            deep: 'differentValue',
            another: 99
          }
        }
      },
      options: {
        ignorePaths: [{ path: ['data', 'nested'], doc: ['Entire nested subtree ignored'] }]
      }
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should ignore paths with wildcard matching array indices', async () => {
    const result = await compareData({
      expected: {
        data: {
          allFahrtereignis: [
            { name: 'event1', richtung: 'NORD' },
            { name: 'event2', richtung: 'SUED' }
          ]
        }
      },
      actual: {
        data: {
          allFahrtereignis: [
            { name: 'event1', richtung: 'WEST' },
            { name: 'event2', richtung: 'OST' }
          ]
        }
      },
      options: {
        ignorePaths: [
          { path: ['data', 'allFahrtereignis', '*', 'richtung'], doc: ['Richtung wird ignoriert'] }
        ]
      }
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should NOT ignore paths that do not match', async () => {
    const result = await compareData({
      expected: { name: 'John', age: 30 },
      actual: { name: 'Jane', age: 30 },
      options: {
        ignorePaths: [{ path: ['age'], doc: ['Only age is ignored'] }]
      }
    })

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].path).toBe('name')
  })

  it('should behave normally with empty ignorePaths array', async () => {
    const result = await compareData({
      expected: { name: 'John', age: 30 },
      actual: { name: 'John', age: 30 },
      options: {
        ignorePaths: []
      }
    })

    expect(result.success).toBe(true)
  })

  it('should behave normally without ignorePaths option', async () => {
    const result = await compareData({
      expected: { name: 'John', age: 30 },
      actual: { name: 'Jane', age: 30 }
    })

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('should ignore entire array element subtree when wildcard matches', async () => {
    // This tests the scenario where both expected and actual have arrays with different
    // lengths at an ignored path - the subtree should be completely skipped
    const result = await compareData({
      expected: {
        data: {
          allFahrtereignis: [
            { name: 'event1', richtung: { value: 'NORD', extra: [1, 2, 3] } }
          ]
        }
      },
      actual: {
        data: {
          allFahrtereignis: [
            { name: 'event1', richtung: { value: 'WEST', extra: [4, 5] } }
          ]
        }
      },
      options: {
        ignorePaths: [
          { path: ['data', 'allFahrtereignis', '*', 'richtung'], doc: ['Deep subtree test'] }
        ]
      }
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should show doc strings in the ignored detail message', async () => {
    const result = await compareData({
      expected: { field: 'a' },
      actual: { field: 'b' },
      options: {
        ignorePaths: [{ path: ['field'], doc: ['Reason 1', 'Reason 2'] }]
      }
    })

    expect(result.success).toBe(true)
    const detail = result.details.find(d => d.path === 'field')
    expect(detail?.message).toContain('Reason 1')
    expect(detail?.message).toContain('Reason 2')
  })

  it('should handle ignorePaths with number segments', async () => {
    const result = await compareData({
      expected: {
        items: [
          { value: 'keep' },
          { value: 'expected' }
        ]
      },
      actual: {
        items: [
          { value: 'keep' },
          { value: 'different' }
        ]
      },
      options: {
        // Using number path segment to target specific array index
        ignorePaths: [{ path: ['items', '[1]', 'value'], doc: ['Second item value ignored'] }]
      }
    })

    expect(result.success).toBe(true)
  })
})
