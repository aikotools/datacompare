/**
 * @aikotools/datacompare
 *
 * Advanced data comparison engine with directive-based matching for E2E testing
 */

// Core exports
export { CompareEngine, CompareParser, CompareRegistry } from './core'
export type {
  CompareRequest,
  CompareResult,
  CompareOptions,
  CompareContext,
  CompareError,
  CompareDetail,
  CompareStats,
  CompareErrorType,
  IgnorePathConfig,
  ParsedDirective,
  ParsedTransform,
  MatchContext,
  MatchResult,
  DirectiveRequest,
  TimeRange,
  TimeUnit,
  NumberRange,
  NumberTolerance,
  ReferencePlaceholder,
  ReferencePath,
} from './core/types'
export { COMPARE_KEYWORDS } from './core/types'

// Directives
export type { CompareDirective } from './directives'
export {
  StartsWithDirective,
  EndsWithDirective,
  RegexDirective,
  ContainsDirective,
  TimeDirective,
  NumberDirective,
} from './directives'

// Matchers
export type { CompareMatcher } from './matchers/Matcher'

// Transforms
export type { CompareTransform } from './transforms/Transform'

// Utils
export { TimeUtils, NumberUtils } from './utils'

// Convenience function
import { CompareEngine } from './core/CompareEngine'
import { CompareRegistry } from './core/CompareRegistry'
import {
  StartsWithDirective,
  EndsWithDirective,
  RegexDirective,
  ContainsDirective,
  TimeDirective,
  NumberDirective,
} from './directives'
import type { CompareRequest, CompareResult } from './core/types'

/**
 * Create a default compare engine with all built-in directives registered
 */
export function createDefaultEngine(): CompareEngine {
  const registry = new CompareRegistry()

  // Register built-in directives
  registry.registerDirective(new StartsWithDirective())
  registry.registerDirective(new EndsWithDirective())
  registry.registerDirective(new RegexDirective())
  registry.registerDirective(new ContainsDirective())
  registry.registerDirective(new TimeDirective())
  registry.registerDirective(new NumberDirective())

  return new CompareEngine(registry)
}

/**
 * Convenience function for one-off comparisons
 *
 * Creates a default engine and performs comparison
 */
export async function compareData(request: CompareRequest): Promise<CompareResult> {
  const engine = createDefaultEngine()
  return engine.compare(request)
}
