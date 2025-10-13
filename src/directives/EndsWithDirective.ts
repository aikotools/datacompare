import type { CompareDirective } from './CompareDirective'
import type { DirectiveRequest, MatchResult, MatchContext } from '../core/types'

/**
 * EndsWith directive for string pattern matching
 *
 * Validates that a string ends with a specific pattern
 *
 * Example: {{compare:endsWith:@example.com}}
 */
export class EndsWithDirective implements CompareDirective {
  readonly name = 'endsWith'

  createMatcher(request: DirectiveRequest) {
    const { directive } = request

    if (directive.args.length === 0) {
      throw new Error('endsWith directive requires at least one argument')
    }

    const pattern = directive.args.join(':') // Rejoin in case pattern contained escaped colons

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, _context: MatchContext): MatchResult => {
      // Check if actual is a string
      if (typeof actual !== 'string') {
        return {
          success: false,
          error: `Expected string, got ${typeof actual}`,
        }
      }

      // Check if actual ends with pattern
      if (actual.endsWith(pattern)) {
        return {
          success: true,
          details: `String ends with '${pattern}'`,
        }
      }

      return {
        success: false,
        error: `Expected string to end with '${pattern}', but got '${actual}'`,
      }
    }
  }
}
