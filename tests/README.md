# MEC CLI Test Suite

Comprehensive test coverage for the MEC CLI application.

## Test Categories

- **Core Tests** (`test-core.ts`) - Business logic, dependency injection, configuration
- **Parser Tests** (`test-parser.ts`) - Command-line parsing and CLI structure  
- **Utility Tests** (`test-utils.ts`) - Helper functions and formatters
- **Translations Tests** (`test-translations.ts`) - Translation service
- **Interceptor Tests** (`test-interceptors.ts`) - HTTP clients and authentication
- **Integration Tests** (`test-cli.sh`) - End-to-end bash script testing

## Running Tests

```bash
# Run all tests (bash + TypeScript)
npm test

# Run bash script tests only
./tests/test-cli.sh

# All TypeScript tests
npx ts-node tests/test-all.ts

# Individual test suites (from project root)
npx ts-node tests/test-core.ts
npx ts-node tests/test-parser.ts
npx ts-node tests/test-utils.ts
npx ts-node tests/test-translations.ts
npx ts-node tests/test-interceptors.ts
```

## Coverage

✅ All major components tested: Core architecture, CLI parsing, utilities, HTTP layer, and integration scenarios.
