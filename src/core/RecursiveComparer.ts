import { CompareParser } from './CompareParser'
import { CompareRegistry } from './CompareRegistry'
import {
  CompareErrorType,
  type CompareError,
  type CompareDetail,
  type CompareOptions,
  type CompareContext,
  type IgnorePathConfig,
  type MatchContext,
} from './types'

/**
 * Recursive deep comparer for objects and arrays
 *
 * Handles:
 * - Objects (partial and exact matching)
 * - Arrays (ordered, unordered, partial)
 * - Primitives (strings, numbers, booleans)
 * - Compare directives
 * - Special keywords (exact, ignore, ignoreRest, ignoreOrder)
 */
export class RecursiveComparer {
  private parser: CompareParser
  private registry: CompareRegistry
  private errors: CompareError[]
  private details: CompareDetail[]
  private currentDepth: number
  private maxDepthReached: number

  constructor(parser: CompareParser, registry: CompareRegistry) {
    this.parser = parser
    this.registry = registry
    this.errors = []
    this.details = []
    this.currentDepth = 0
    this.maxDepthReached = 0
  }

  /**
   * Compare two values recursively
   */
  async compare(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    path: string[],
    context: CompareContext,
    options: CompareOptions
  ): Promise<{ errors: CompareError[]; details: CompareDetail[]; maxDepthReached: number }> {
    this.errors = []
    this.details = []
    this.currentDepth = 0
    this.maxDepthReached = 0

    await this.compareInternal(expected, actual, path, context, options)

    return {
      errors: this.errors,
      details: this.details,
      maxDepthReached: this.maxDepthReached,
    }
  }

  /**
   * Internal recursive comparison
   */
  private async compareInternal(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    path: string[],
    context: CompareContext,
    options: CompareOptions
  ): Promise<void> {
    // Track depth
    this.currentDepth++
    if (this.currentDepth > this.maxDepthReached) {
      this.maxDepthReached = this.currentDepth
    }

    // Check max depth
    if (options.maxDepth && this.currentDepth > options.maxDepth) {
      this.addError(
        path,
        CompareErrorType.DIRECTIVE_ERROR,
        expected,
        actual,
        `Maximum depth ${options.maxDepth} exceeded`
      )
      this.currentDepth--
      return
    }

    // Check max errors
    if (options.maxErrors && this.errors.length >= options.maxErrors) {
      this.currentDepth--
      return
    }

    // Check if this path should be ignored
    if (options.ignorePaths && options.ignorePaths.length > 0) {
      const matched = this.shouldIgnorePath(path, options.ignorePaths)
      if (matched) {
        this.addDetail(
          path,
          true,
          expected,
          actual,
          `Ignored by ignorePath: ${matched.doc?.join(', ') ?? 'no reason'}`
        )
        this.currentDepth--
        return
      }
    }

    try {
      // Handle null/undefined
      if (expected === null || expected === undefined) {
        if (expected !== actual) {
          this.addError(path, CompareErrorType.VALUE_MISMATCH, expected, actual, 'Value mismatch')
        } else {
          this.addDetail(path, true, expected, actual)
        }
        return
      }

      // Check for special keywords FIRST (before directive parsing)
      if (typeof expected === 'string') {
        if (expected === '{{compare:ignore}}') {
          // Ignore this value
          this.addDetail(path, true, expected, actual, 'Ignored by directive')
          return
        }
      }

      // Check for compare directives in expected
      if (typeof expected === 'string' && this.parser.isDirective(expected)) {
        await this.compareWithDirective(expected, actual, path, context)
        return
      }

      // Handle arrays
      if (Array.isArray(expected)) {
        await this.compareArrays(expected, actual, path, context, options)
        return
      }

      // Handle objects
      if (typeof expected === 'object' && expected !== null) {
        await this.compareObjects(expected, actual, path, context, options)
        return
      }

      // Handle primitives (string, number, boolean)
      this.comparePrimitives(expected, actual, path)
    } finally {
      this.currentDepth--
    }
  }

  /**
   * Compare with a compare directive
   */
  private async compareWithDirective(
    expectedDirective: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    path: string[],
    context: CompareContext
  ): Promise<void> {
    try {
      const parsed = this.parser.parse(expectedDirective)
      const directive = this.registry.getDirective(parsed.action)

      // Create matcher from directive
      const matcherFn = directive.createMatcher({
        directive: parsed,
        context,
        registry: this.registry,
      })

      // Execute match
      const matchContext: MatchContext = {
        path,
        actual,
        expected: expectedDirective,
        compareContext: context,
      }

      const result = matcherFn(actual, expectedDirective, matchContext)

      if (result.success) {
        this.addDetail(path, true, expectedDirective, actual, result.details)
      } else {
        this.addError(
          path,
          CompareErrorType.PATTERN_MISMATCH,
          expectedDirective,
          actual,
          result.error || 'Directive match failed'
        )
      }
    } catch (error) {
      this.addError(
        path,
        CompareErrorType.DIRECTIVE_ERROR,
        expectedDirective,
        actual,
        `Directive error: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Compare two objects
   */
  private async compareObjects(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    path: string[],
    context: CompareContext,
    options: CompareOptions
  ): Promise<void> {
    // Check if actual is also an object
    if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
      this.addError(
        path,
        CompareErrorType.TYPE_MISMATCH,
        'object',
        typeof actual,
        'Expected object'
      )
      return
    }

    // Check for exact matching keyword
    const isExactMode = expected['{{compare:exact}}'] === true || options.strictMode === true

    // Compare all properties in expected
    for (const key of Object.keys(expected)) {
      // Skip special keywords
      if (key === '{{compare:exact}}') continue

      const expectedValue = expected[key]
      const actualValue = actual[key]
      const newPath = [...path, key]

      // Check if property exists in actual
      if (!(key in actual)) {
        this.addError(
          newPath,
          CompareErrorType.MISSING_PROPERTY,
          expectedValue,
          undefined,
          `Property '${key}' missing in actual object`
        )
        continue
      }

      // Recursively compare property
      await this.compareInternal(expectedValue, actualValue, newPath, context, options)
    }

    // In exact mode, check for extra properties in actual
    if (isExactMode || !options.ignoreExtraProperties) {
      for (const key of Object.keys(actual)) {
        if (!(key in expected)) {
          this.addError(
            [...path, key],
            CompareErrorType.EXTRA_PROPERTY,
            undefined,
            actual[key],
            `Extra property '${key}' in actual object`
          )
        }
      }
    }
  }

  /**
   * Compare two arrays
   */
  private async compareArrays(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    path: string[],
    context: CompareContext,
    options: CompareOptions
  ): Promise<void> {
    // Check if actual is also an array
    if (!Array.isArray(actual)) {
      this.addError(path, CompareErrorType.TYPE_MISMATCH, 'array', typeof actual, 'Expected array')
      return
    }

    // Check for special array keywords
    const hasIgnoreOrder = expected.includes('{{compare:ignoreOrder}}')
    const hasIgnoreRest = expected.includes('{{compare:ignoreRest}}')

    // Filter out special keywords from expected
    const filteredExpected = expected.filter(
      item => item !== '{{compare:ignoreOrder}}' && item !== '{{compare:ignoreRest}}'
    )

    if (hasIgnoreOrder) {
      await this.compareArraysUnordered(filteredExpected, actual, path, context, options)
    } else if (hasIgnoreRest) {
      await this.compareArraysPartial(filteredExpected, actual, path, context, options)
    } else {
      await this.compareArraysOrdered(filteredExpected, actual, path, context, options)
    }
  }

  /**
   * Compare arrays in order
   */
  private async compareArraysOrdered(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any[],
    path: string[],
    context: CompareContext,
    options: CompareOptions
  ): Promise<void> {
    // Check lengths
    if (expected.length !== actual.length) {
      this.addError(
        path,
        CompareErrorType.ARRAY_LENGTH_MISMATCH,
        expected.length,
        actual.length,
        `Array length mismatch: expected ${expected.length}, got ${actual.length}`
      )
    }

    // Compare elements
    const minLength = Math.min(expected.length, actual.length)
    for (let i = 0; i < minLength; i++) {
      const expectedItem = expected[i]
      const actualItem = actual[i]

      // Check for {{compare:ignore}} wildcard
      if (expectedItem === '{{compare:ignore}}') {
        this.addDetail([...path, `[${i}]`], true, expectedItem, actualItem, 'Ignored by directive')
        continue
      }

      await this.compareInternal(expectedItem, actualItem, [...path, `[${i}]`], context, options)
    }
  }

  /**
   * Compare arrays ignoring order (set-like comparison)
   */
  private async compareArraysUnordered(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any[],
    path: string[],
    context: CompareContext,
    options: CompareOptions
  ): Promise<void> {
    // Check lengths
    if (expected.length !== actual.length) {
      this.addError(
        path,
        CompareErrorType.ARRAY_LENGTH_MISMATCH,
        expected.length,
        actual.length,
        `Array length mismatch: expected ${expected.length}, got ${actual.length}`
      )
      return
    }

    // Track which actual elements have been matched
    const matchedActualIndices = new Set<number>()

    // Try to match each expected element with an actual element
    for (let i = 0; i < expected.length; i++) {
      const expectedItem = expected[i]
      let found = false

      for (let j = 0; j < actual.length; j++) {
        if (matchedActualIndices.has(j)) continue

        const actualItem = actual[j]

        // Try to match (we need to do a test comparison)
        const testResult = await this.testMatch(expectedItem, actualItem, context, options)

        if (testResult) {
          matchedActualIndices.add(j)
          this.addDetail(
            [...path, `[${i}]`],
            true,
            expectedItem,
            actualItem,
            'Matched in unordered array'
          )
          found = true
          break
        }
      }

      if (!found) {
        this.addError(
          [...path, `[${i}]`],
          CompareErrorType.ARRAY_ELEMENT_MISMATCH,
          expectedItem,
          undefined,
          `No matching element found in actual array`
        )
      }
    }
  }

  /**
   * Compare arrays with partial matching (ignoreRest)
   */
  private async compareArraysPartial(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any[],
    path: string[],
    context: CompareContext,
    options: CompareOptions
  ): Promise<void> {
    // Only compare the first N elements where N = expected.length
    if (actual.length < expected.length) {
      this.addError(
        path,
        CompareErrorType.ARRAY_LENGTH_MISMATCH,
        `at least ${expected.length}`,
        actual.length,
        `Array too short: expected at least ${expected.length} elements, got ${actual.length}`
      )
      return
    }

    // Compare elements
    for (let i = 0; i < expected.length; i++) {
      await this.compareInternal(expected[i], actual[i], [...path, `[${i}]`], context, options)
    }

    // Note: Additional elements in actual are ignored
  }

  /**
   * Test if two values match (for unordered array comparison)
   */
  private async testMatch(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    context: CompareContext,
    options: CompareOptions
  ): Promise<boolean> {
    // Create a temporary comparer
    const tempComparer = new RecursiveComparer(this.parser, this.registry)
    const result = await tempComparer.compare(expected, actual, [], context, options)
    return result.errors.length === 0
  }

  /**
   * Compare primitive values
   */
  private comparePrimitives(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    path: string[]
  ): void {
    if (expected === actual) {
      this.addDetail(path, true, expected, actual)
    } else {
      this.addError(path, CompareErrorType.VALUE_MISMATCH, expected, actual, 'Value mismatch')
    }
  }

  /**
   * Add an error
   */
  private addError(
    path: string[],
    type: CompareErrorType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    message: string
  ): void {
    this.errors.push({
      path: path.join('.') || 'root',
      type,
      expected,
      actual,
      message,
    })
  }

  /**
   * Add a detail
   */
  private addDetail(
    path: string[],
    passed: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actual: any,
    message?: string
  ): void {
    this.details.push({
      path: path.join('.') || 'root',
      passed,
      expected,
      actual,
      message,
    })
  }

  /**
   * Check if the current path should be ignored based on ignorePaths config.
   * Returns the matching IgnorePathConfig if found, undefined otherwise.
   *
   * A path matches if:
   * - The ignorePath is equal in length or shorter than currentPath
   * - All segments of the ignorePath match the corresponding currentPath segments
   * - '*' in ignorePath matches any segment (including array indices like '[0]')
   */
  private shouldIgnorePath(
    currentPath: string[],
    ignorePaths: IgnorePathConfig[]
  ): IgnorePathConfig | undefined {
    for (const ignorePath of ignorePaths) {
      const segments = ignorePath.path.map(String)

      // ignorePath must not be longer than currentPath
      if (segments.length > currentPath.length) {
        continue
      }

      let matches = true
      for (let i = 0; i < segments.length; i++) {
        const ignoreSegment = segments[i]
        const currentSegment = currentPath[i]

        if (ignoreSegment === '*') {
          // Wildcard matches any segment
          continue
        }

        if (ignoreSegment === currentSegment) {
          continue
        }

        matches = false
        break
      }

      if (matches) {
        return ignorePath
      }
    }

    return undefined
  }
}
