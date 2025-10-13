import type { ParsedDirective, ParsedTransform } from './types'

/**
 * Parser for compare directives
 *
 * Parses {{compare:action:arg1:arg2|transform1|transform2}} syntax
 */
export class CompareParser {
  /**
   * Check if a string contains a compare directive
   *
   * NOTE: This allows curly braces inside the directive (e.g., regex patterns with {5})
   */
  isDirective(value: string): boolean {
    if (typeof value !== 'string') return false
    // Match {{compare:...}} where ... can contain any characters except the closing }}
    return /^\{\{compare:.+?\}\}$/.test(value.trim())
  }

  /**
   * Find all compare directives in a string
   *
   * NOTE: This allows curly braces inside directives (e.g., regex patterns with {5})
   */
  findDirectives(content: string): string[] {
    if (typeof content !== 'string') return []

    // Match {{compare:...}} where ... can contain any characters except }}
    const pattern = /\{\{compare:.+?\}\}/g
    const matches = content.match(pattern)
    return matches || []
  }

  /**
   * Parse a compare directive string
   *
   * Examples:
   * - {{compare:startsWith:Hello}}
   * - {{compare:time:range:±300:seconds}}
   * - {{compare:regex:user_\d+|toString}}
   */
  parse(directive: string): ParsedDirective {
    if (!this.isDirective(directive)) {
      throw new Error(`Invalid directive format: ${directive}`)
    }

    // Remove {{compare: and }}
    const inner = directive.slice(10, -2) // '{{compare:'.length = 10, '}}'.length = 2

    // Split by | to separate main part from transforms
    const parts = inner.split('|')
    const mainPart = parts[0]
    const transformParts = parts.slice(1)

    // Parse main part (action:arg1:arg2:...)
    const mainSegments = this.splitByUnescapedColon(mainPart)
    if (mainSegments.length === 0) {
      throw new Error(`Invalid directive: missing action in ${directive}`)
    }

    const action = mainSegments[0]
    const args = mainSegments.slice(1)

    // Parse transforms
    const transforms = transformParts.map(t => this.parseTransform(t))

    return {
      original: directive,
      action,
      args,
      transforms,
    }
  }

  /**
   * Parse a transform string
   *
   * Examples:
   * - toNumber → {name: 'toNumber', params: []}
   * - substring:0:10 → {name: 'substring', params: ['0', '10']}
   */
  private parseTransform(transformStr: string): ParsedTransform {
    const segments = this.splitByUnescapedColon(transformStr)
    const name = segments[0]
    const params = segments.slice(1)

    return { name, params }
  }

  /**
   * Split a string by colons, but not escaped colons (\:)
   *
   * Example: "a:b\:c:d" → ["a", "b:c", "d"]
   *
   * NOTE: Preserves backslashes that are NOT escaping colons
   * Example: "user_\d{5}" → ["user_\d{5}"]
   */
  private splitByUnescapedColon(str: string): string[] {
    const result: string[] = []
    let current = ''
    let i = 0

    while (i < str.length) {
      if (str[i] === '\\' && str[i + 1] === ':') {
        // Escaped colon - add literal colon (without backslash)
        current += ':'
        i += 2
      } else if (str[i] === ':') {
        // Unescaped colon - split here
        result.push(current)
        current = ''
        i++
      } else {
        // Regular character (including backslashes that don't escape colons)
        current += str[i]
        i++
      }
    }

    // Add last segment
    if (current.length > 0 || str.endsWith(':')) {
      result.push(current)
    }

    return result
  }

  /**
   * Unescape a string (convert \: back to :, etc.)
   */
  unescape(str: string): string {
    return str.replace(/\\:/g, ':').replace(/\\\\/g, '\\')
  }

  /**
   * Check if a string is a special keyword (exact, ignore, etc.)
   */
  isKeyword(value: string): boolean {
    if (typeof value !== 'string') return false
    return (
      value === '{{compare:exact}}' ||
      value === '{{compare:ignore}}' ||
      value === '{{compare:ignoreRest}}' ||
      value === '{{compare:ignoreOrder}}'
    )
  }
}
