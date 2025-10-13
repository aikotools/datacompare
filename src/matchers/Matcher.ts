import type { MatchResult, MatchContext } from '../core/types'

/**
 * Interface for compare matchers
 *
 * Matchers perform intelligent comparisons beyond simple equality,
 * such as regex matching, tolerance-based matching, time ranges, etc.
 */
export interface CompareMatcher {
  /**
   * Perform the match operation
   *
   * @param actual - Actual value from data
   * @param expected - Expected value (may contain directive or pattern)
   * @param context - Match context with path and full objects
   * @returns Match result with success status and optional error message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match(actual: any, expected: any, context: MatchContext): MatchResult
}
