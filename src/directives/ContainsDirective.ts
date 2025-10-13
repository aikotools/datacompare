import type { CompareDirective } from './CompareDirective'
import type { DirectiveRequest, MatchResult, MatchContext } from '../core/types'

/**
 * Contains directive for string pattern matching
 *
 * Validates that a string contains a specific substring
 *
 * Example: {{compare:contains:error}}
 */
export class ContainsDirective implements CompareDirective {
  readonly name = 'contains'

  createMatcher(request: DirectiveRequest) {
    const { directive } = request

    if (directive.args.length === 0) {
      throw new Error('contains directive requires at least one argument')
    }

    const substring = directive.args.join(':') // Rejoin in case pattern contained escaped colons

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, _context: MatchContext): MatchResult => {
      // Check if actual is a string
      if (typeof actual !== 'string') {
        return {
          success: false,
          error: `Expected string, got ${typeof actual}`,
        }
      }

      // Check if actual contains substring
      if (actual.includes(substring)) {
        return {
          success: true,
          details: `String contains '${substring}'`,
        }
      }

      return {
        success: false,
        error: `Expected string to contain '${substring}', but got '${actual}'`,
      }
    }
  }
}
