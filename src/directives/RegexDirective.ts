import type { CompareDirective } from './CompareDirective';
import type { DirectiveRequest, MatchResult, MatchContext } from '../core/types';

/**
 * Regex directive for string pattern matching
 *
 * Validates that a string matches a regular expression
 *
 * Example: {{compare:regex:user_\d{5}}}
 */
export class RegexDirective implements CompareDirective {
  readonly name = 'regex';

  createMatcher(request: DirectiveRequest) {
    const { directive } = request;

    if (directive.args.length === 0) {
      throw new Error('regex directive requires at least one argument');
    }

    const pattern = directive.args.join(':'); // Rejoin in case pattern contained escaped colons

    // Compile regex
    let regex: RegExp;
    try {
      regex = new RegExp(pattern);
    } catch (error) {
      throw new Error(
        `Invalid regex pattern '${pattern}': ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, _context: MatchContext): MatchResult => {
      // Check if actual is a string
      if (typeof actual !== 'string') {
        return {
          success: false,
          error: `Expected string, got ${typeof actual}`,
        };
      }

      // Test regex
      if (regex.test(actual)) {
        return {
          success: true,
          details: `String matches pattern /${pattern}/`,
        };
      }

      return {
        success: false,
        error: `Expected string to match pattern /${pattern}/, but got '${actual}'`,
      };
    };
  }
}
