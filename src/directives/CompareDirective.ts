import type { DirectiveRequest, MatchResult, MatchContext } from '../core/types'

/**
 * Base interface for compare directives
 *
 * Directives handle special comparison logic like:
 * - String patterns (startsWith, endsWith, regex)
 * - Time ranges
 * - Number ranges
 * - References
 */
export interface CompareDirective {
  /**
   * Unique name for this directive (e.g., 'startsWith', 'time', 'ref')
   */
  readonly name: string

  /**
   * Create a matcher for this directive
   *
   * The matcher will be used during comparison to validate actual values
   * against expected patterns/criteria.
   *
   * @param request - Directive request with parsed directive and context
   * @returns A function that performs the match
   */
  createMatcher(
    request: DirectiveRequest
  ): (actual: any, expected: any, context: MatchContext) => MatchResult // eslint-disable-line @typescript-eslint/no-explicit-any
}
