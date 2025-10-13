import type { CompareDirective } from '../directives/CompareDirective';
import type { CompareMatcher } from '../matchers/Matcher';
import type { CompareTransform } from '../transforms/Transform';

/**
 * Registry for compare directives, matchers, and transforms
 *
 * Similar to PluginRegistry in @aikotools/placeholder
 */
export class CompareRegistry {
  private directives: Map<string, CompareDirective> = new Map();
  private matchers: Map<string, CompareMatcher> = new Map();
  private transforms: Map<string, CompareTransform> = new Map();

  /**
   * Register a compare directive
   */
  registerDirective(directive: CompareDirective): void {
    if (this.directives.has(directive.name)) {
      throw new Error(`Directive '${directive.name}' is already registered`);
    }
    this.directives.set(directive.name, directive);
  }

  /**
   * Get a directive by name
   */
  getDirective(name: string): CompareDirective {
    const directive = this.directives.get(name);
    if (!directive) {
      throw new Error(`Unknown directive: ${name}`);
    }
    return directive;
  }

  /**
   * Check if a directive is registered
   */
  hasDirective(name: string): boolean {
    return this.directives.has(name);
  }

  /**
   * Register a matcher
   */
  registerMatcher(name: string, matcher: CompareMatcher): void {
    if (this.matchers.has(name)) {
      throw new Error(`Matcher '${name}' is already registered`);
    }
    this.matchers.set(name, matcher);
  }

  /**
   * Get a matcher by name
   */
  getMatcher(name: string): CompareMatcher {
    const matcher = this.matchers.get(name);
    if (!matcher) {
      throw new Error(`Unknown matcher: ${name}`);
    }
    return matcher;
  }

  /**
   * Check if a matcher is registered
   */
  hasMatcher(name: string): boolean {
    return this.matchers.has(name);
  }

  /**
   * Register a transform
   */
  registerTransform(transform: CompareTransform): void {
    if (this.transforms.has(transform.name)) {
      throw new Error(`Transform '${transform.name}' is already registered`);
    }
    this.transforms.set(transform.name, transform);
  }

  /**
   * Get a transform by name
   */
  getTransform(name: string): CompareTransform {
    const transform = this.transforms.get(name);
    if (!transform) {
      throw new Error(`Unknown transform: ${name}`);
    }
    return transform;
  }

  /**
   * Check if a transform is registered
   */
  hasTransform(name: string): boolean {
    return this.transforms.has(name);
  }

  /**
   * Get list of all registered directive names
   */
  getDirectiveNames(): string[] {
    return Array.from(this.directives.keys());
  }

  /**
   * Get list of all registered matcher names
   */
  getMatcherNames(): string[] {
    return Array.from(this.matchers.keys());
  }

  /**
   * Get list of all registered transform names
   */
  getTransformNames(): string[] {
    return Array.from(this.transforms.keys());
  }

  /**
   * Clear all registered directives (useful for testing)
   */
  clear(): void {
    this.directives.clear();
    this.matchers.clear();
    this.transforms.clear();
  }
}
