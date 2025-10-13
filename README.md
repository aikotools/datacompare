# @aikotools/datacompare

Advanced data comparison engine with directive-based matching for E2E testing.

[![npm version](https://badge.fury.io/js/@aikotools%2Fdatacompare.svg)](https://www.npmjs.com/package/@aikotools/datacompare)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

`@aikotools/datacompare` provides sophisticated recursive object and array comparison with support for:

- **Deep Recursive Comparison**: Navigate nested object and array structures
- **Directive-Based Matching**: Flexible comparison directives with `{{compare:...}}` syntax
- **Time Range Comparisons**: Compare timestamps with tolerance ranges (±5 minutes, etc.)
- **Number Range Comparisons**: Validate numbers within ranges or tolerances
- **String Pattern Matching**: Regex, startsWith, endsWith, contains patterns
- **Array Flexibility**: Order-independent, partial matching, wildcards
- **Type Preservation**: Maintains proper types during comparison

## Installation

```bash
npm install @aikotools/datacompare
```

## Quick Start

```typescript
import { compareData } from '@aikotools/datacompare';

const result = await compareData({
  expected: {
    userId: 'user_12345',
    email: '{{compare:endsWith:@example.com}}',
    score: '{{compare:number:range:0:100}}',
    timestamp: '{{compare:time:range:-60:+60:seconds}}',
  },
  actual: {
    userId: 'user_12345',
    email: 'john.doe@example.com',
    score: 85,
    timestamp: '2023-12-01T10:30:00Z',
    extra: 'ignored by default',
  },
  context: {
    startTimeTest: '2023-12-01T10:30:00Z',
  },
});

console.log(result.success); // true
console.log(result.stats);   // { totalChecks: 4, passedChecks: 4, ... }
```

## Features

### 1. Basic Object Comparison

```typescript
await compareData({
  expected: { name: 'John', age: 30 },
  actual: { name: 'John', age: 30, extra: 'ignored' },
});
// ✅ Passes - extra properties ignored by default
```

### 2. Array Comparison

```typescript
// Ordered comparison
await compareData({
  expected: [1, 2, 3],
  actual: [1, 2, 3],
});
// ✅ Exact match

// Order-independent
await compareData({
  expected: ['{{compare:ignoreOrder}}', 'apple', 'banana'],
  actual: ['banana', 'apple'],
});
// ✅ Order doesn't matter

// Partial matching
await compareData({
  expected: [1, 2, '{{compare:ignoreRest}}'],
  actual: [1, 2, 3, 4, 5],
});
// ✅ Only validates first 2 elements
```

### 3. String Pattern Directives

```typescript
await compareData({
  expected: {
    message: '{{compare:startsWith:Hello}}',
    email: '{{compare:endsWith:@example.com}}',
    userId: '{{compare:regex:user_[0-9]{5}}}',
    log: '{{compare:contains:ERROR}}',
  },
  actual: {
    message: 'Hello World',
    email: 'john@example.com',
    userId: 'user_12345',
    log: '[2023-12-01] ERROR: Failed',
  },
});
// ✅ All patterns match
```

### 4. Time Range Comparisons (NEW!)

```typescript
const now = new Date().toISOString();

// Combined range: past and future (±5 minutes)
await compareData({
  expected: { timestamp: '{{compare:time:range:-300:+300:seconds}}' },
  actual: { timestamp: now },
  context: { startTimeTest: now },
});

// Future only: up to 1 hour in the future
await compareData({
  expected: { timestamp: '{{compare:time:range:+60:minutes}}' },
  actual: { timestamp: futureTime },
  context: { startTimeTest: now },
});

// Past only: up to 1 hour in the past
await compareData({
  expected: { timestamp: '{{compare:time:range:-60:minutes}}' },
  actual: { timestamp: pastTime },
  context: { startTimeTest: now },
});

// Exact time match
await compareData({
  expected: { timestamp: '{{compare:time:exact}}' },
  actual: { timestamp: now },
  context: { startTimeTest: now },
});
```

### 5. Number Range Comparisons (NEW!)

```typescript
// Range validation
await compareData({
  expected: { score: '{{compare:number:range:0:100}}' },
  actual: { score: 85 },
});
// ✅ 85 is within [0, 100]

// Tolerance (absolute)
await compareData({
  expected: { value: '{{compare:number:tolerance:42:±5}}' },
  actual: { value: 44 },
});
// ✅ 44 is within 42±5 (37-47)

// Tolerance (percentage)
await compareData({
  expected: { value: '{{compare:number:tolerance:100:±10%}}' },
  actual: { value: 95 },
});
// ✅ 95 is within 100±10% (90-110)
```

### 6. Special Keywords

```typescript
// Exact matching (no extra properties allowed)
await compareData({
  expected: {
    '{{compare:exact}}': true,
    name: 'John',
    age: 30,
  },
  actual: {
    name: 'John',
    age: 30,
    extra: 'property', // ❌ Will cause error in exact mode
  },
});

// Ignore specific values
await compareData({
  expected: {
    userId: 'user_123',
    timestamp: '{{compare:ignore}}', // Ignored
  },
  actual: {
    userId: 'user_123',
    timestamp: '2023-12-01T10:30:00Z', // Any value OK
  },
});
```

## API Reference

### compareData(request: CompareRequest): Promise<CompareResult>

Main comparison function.

**Parameters:**
- `expected`: Expected object with compare directives
- `actual`: Actual object to compare against
- `context`: Optional context (startTimeTest, startTimeScript, etc.)
- `options`: Optional comparison options

**Returns:** `CompareResult` with:
- `success`: boolean - Overall status
- `errors`: CompareError[] - List of all errors
- `details`: CompareDetail[] - Detailed check information
- `stats`: CompareStats - Comparison statistics

### createDefaultEngine(): CompareEngine

Creates a CompareEngine with all built-in directives registered.

### CompareEngine

Core comparison engine. Use for custom directive registration:

```typescript
import { createDefaultEngine, MyCustomDirective } from '@aikotools/datacompare';

const engine = createDefaultEngine();
engine.getRegistry().registerDirective(new MyCustomDirective());

const result = await engine.compare({
  expected: { /* ... */ },
  actual: { /* ... */ },
});
```

## Directive Reference

### String Patterns
- `{{compare:startsWith:pattern}}` - String must start with pattern
- `{{compare:endsWith:pattern}}` - String must end with pattern
- `{{compare:regex:pattern}}` - String must match regex
- `{{compare:contains:substring}}` - String must contain substring

### Time Ranges
- `{{compare:time:range:-N:+M:unit}}` - Time within range (N units in past, M units in future)
- `{{compare:time:range:+N:unit}}` - Time within N units in the future only
- `{{compare:time:range:-N:unit}}` - Time within N units in the past only
- `{{compare:time:exact}}` - Exact time match

**Units:** milliseconds, seconds, minutes, hours, days, weeks, months, years

### Number Ranges
- `{{compare:number:range:min:max}}` - Number within [min, max]
- `{{compare:number:tolerance:value:±N}}` - Number within value±N
- `{{compare:number:tolerance:value:±N%}}` - Number within value±N%

### Special Keywords
- `{{compare:exact}}` - Enable exact property matching
- `{{compare:ignore}}` - Ignore this value
- `{{compare:ignoreRest}}` - Ignore remaining array elements
- `{{compare:ignoreOrder}}` - Ignore array element order

## Examples

See [tests/integration/BasicComparison.test.ts](tests/integration/BasicComparison.test.ts) for comprehensive examples.

## Migration from e2e-tool-util-compare-object

```typescript
// Old syntax
const expected = {
  "__EXACT__": true,
  userId: "<compare:ref:userId>",
  email: "<CS:ENDS_WITH>@example.com",
};

// New syntax
const expected = {
  "{{compare:exact}}": true,
  userId: "{{compare:ref:userId}}", // Coming in future release
  email: "{{compare:endsWith:@example.com}}",
};
```

## Architecture

```
CompareEngine
├── CompareParser (parses {{compare:...}} directives)
├── CompareRegistry (manages directives, matchers, transforms)
└── RecursiveComparer (deep object/array comparison)
    ├── Object comparison (partial/exact matching)
    ├── Array comparison (ordered/unordered/partial)
    └── Directive evaluation (startsWith, time, number, etc.)
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Format
npm run format
```

## Test Results

✅ 16/18 tests passing
- ✅ Basic object/array comparison
- ✅ String pattern directives (startsWith, endsWith, contains)
- ✅ Time range directives
- ✅ Number range directives
- ✅ Array flexibility (ignoreOrder, ignoreRest)
- 🔧 ignore directive (minor fix needed)
- 🔧 regex directive (escaping issue)

## Roadmap

### Implemented ✅
- [x] Core comparison engine
- [x] Recursive deep comparison
- [x] String pattern directives
- [x] Time range comparisons
- [x] Number range comparisons
- [x] Array flexibility

### Coming Soon
- [ ] Reference directives (`{{compare:ref:anId}}`)
- [ ] Custom transform pipeline
- [ ] JSON/Text processors
- [ ] Performance optimizations

## License

MIT - See [LICENSE](LICENSE) file for details.

## Contributing

This is part of the @aikotools ecosystem. For issues and contributions, please see the repository.

---

**Built with ❤️ for E2E Testing**
