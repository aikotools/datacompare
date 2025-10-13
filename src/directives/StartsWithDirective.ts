import type { CompareDirective } from './CompareDirective';
import type { DirectiveRequest, MatchResult, MatchContext } from '../core/types';

/**
 * StartsWith directive for string pattern matching
 *
 * Validates that a string starts with a specific pattern
 *
 * Example: {{compare:startsWith:Hello}}
 */
export class StartsWithDirective implements CompareDirective {
  readonly name = 'startsWith';

  createMatcher(request: DirectiveRequest) {
    const { directive } = request;

    if (directive.args.length === 0) {
      throw new Error('startsWith directive requires at least one argument');
    }

    const pattern = directive.args.join(':'); // Rejoin in case pattern contained escaped colons

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, _context: MatchContext): MatchResult => {
      // Check if actual is a string
      if (typeof actual !== 'string') {
        return {
          success: false,
          error: `Expected string, got ${typeof actual}`,
        };
      }

      // Check if actual starts with pattern
      if (actual.startsWith(pattern)) {
        return {
          success: true,
          details: `String starts with '${pattern}'`,
        };
      }

      return {
        success: false,
        error: `Expected string to start with '${pattern}', but got '${actual}'`,
      };
    };
  }
}
