---
applyTo: "**/*.{ts,tsx}"
description: "Comprehensive TypeScript coding conventions and best practices for enterprise development"
---

# Comprehensive TypeScript Coding Conventions

## **Compiler Configuration & Project Setup**

### 1. Enable Comprehensive Strict Mode Configuration

- Always set `"strict": true` in `tsconfig.json` for maximum type safety
- Enable specific strict options: `"noImplicitAny": true`, `"strictNullChecks": true`, `"strictFunctionTypes": true`
- Use `"exactOptionalPropertyTypes": true` for precise optional property handling
- Enable `"noImplicitReturns": true` and `"noFallthroughCasesInSwitch": true` for better control flow analysis
- Set `"noUncheckedIndexedAccess": true` to make index signatures safer

### 2. Configure Modern Compilation Target and Module System

- Use `"target": "ES2022"` or higher for modern runtime features and better performance
- Set `"module": "ESNext"` for optimal tree-shaking and bundler compatibility
- Enable `"moduleResolution": "node"` and `"esModuleInterop": true` for better import compatibility
- Configure `"lib"` array to include only necessary runtime APIs (e.g., `["ES2022", "DOM", "DOM.Iterable"]`)
- Use `"skipLibCheck": true` to improve compilation performance in large projects

### 3. Optimize Development Experience and Build Performance

- Enable `"incremental": true` and configure `"tsBuildInfoFile"` for faster subsequent builds
- Set `"sourceMap": true` for debugging support in development
- Use `"declaration": true` and `"declarationMap": true` when building libraries
- Configure `"outDir"` and `"rootDir"` for organized output structure
- Enable `"forceConsistentCasingInFileNames": true` for cross-platform compatibility

## **Type System Best Practices**

### 4. Use Interfaces for Object Shapes, Types for Complex Operations

- Prefer `interface` for object structures that may need extension or declaration merging
- Use `type` for union types, intersection types, computed types, and complex transformations
- Example: `interface User { name: string; }` vs `type Status = 'pending' | 'active' | 'inactive'`
- Always export interfaces and types from dedicated barrel files (`types/index.ts`)
- Use meaningful names that describe the domain concept, not implementation details

### 5. Leverage Advanced Type System Features for Safety

- Use optional chaining (`?.`) for potentially undefined nested properties: `user?.profile?.settings?.theme`
- Prefer nullish coalescing (`??`) over logical OR (`||`) for default values to avoid falsy value issues
- Use the `satisfies` operator for type checking without type widening: `const config = {...} satisfies ConfigType`
- Implement template literal types for string pattern validation and API endpoint typing
- Use `as const` assertions for immutable literal types and configuration objects

### 6. Master Utility Types for Type Transformations

- Use `Partial<T>` for update operations and optional property scenarios
- Apply `Required<T>` to ensure all properties are present when needed
- Leverage `Pick<T, K>` and `Omit<T, K>` for selective property extraction and exclusion
- Use `Record<K, V>` for key-value mappings with consistent value types
- Apply `Readonly<T>` for immutable data structures and configuration objects
- Utilize `ReturnType<T>` and `Parameters<T>` for function type inference

### 7. Implement Advanced Generic Constraints and Patterns

- Use generic constraints with `extends` to limit acceptable types: `<T extends Record<string, unknown>>`
- Implement conditional types for complex type logic: `T extends string ? StringHandler : DefaultHandler`
- Use mapped types for transforming existing types: `{ [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] }`
- Apply recursive type definitions carefully with depth limits to avoid infinite recursion
- Use generic parameter defaults for better API ergonomics: `<T = DefaultType>`

### 8. Create Custom Type Guards and Assertion Functions

- Write custom type guards for runtime type checking: `function isUser(obj: unknown): obj is User`
- Implement assertion functions for validation: `function assertIsNumber(value: unknown): asserts value is number`
- Use discriminated unions with literal types for type-safe state management
- Create branded types for domain-specific values like IDs, emails, and currencies
- Apply the `never` type for exhaustiveness checking in switch statements

## **Code Organization and Module System**

### 9. Structure Imports and Exports for Maintainability

- Use ES6 modules exclusively (`import`/`export`) instead of CommonJS
- Prefer named exports over default exports for better refactoring and IDE support
- Use `import type` for type-only imports to enable proper tree-shaking and avoid circular dependencies
- Organize imports in consistent order: external libraries, internal modules, relative imports, type imports
- Create barrel exports (`index.ts`) with careful re-exports to avoid performance issues

### 10. Organize Code by Feature with Clear Boundaries

- Group related types, interfaces, and utilities in feature-specific modules
- Keep one primary export per file with supporting types co-located
- Use consistent file naming conventions: `kebab-case.ts` for files, `PascalCase` for exported types
- Implement clear separation between business logic, data access, and presentation layers
- Create shared utility modules for cross-cutting concerns

### 11. Implement Proper Dependency Management Patterns

- Use dependency injection patterns for testability and loose coupling
- Create interface-based abstractions for external dependencies
- Implement proper error boundaries and error handling interfaces
- Use factory patterns for complex object creation with proper typing
- Apply the repository pattern for data access with generic interfaces

## **Function and Class Design**

### 12. Write Type-Safe Functions with Explicit Signatures

- Always declare parameter types and return types for public functions
- Use function overloads for functions with multiple valid call signatures
- Prefer readonly parameters for functions that don't mutate inputs: `(items: readonly T[])`
- Use generic constraints to create flexible yet type-safe functions: `<T extends Serializable>`
- Keep functions pure and focused on single responsibilities (maximum 20 lines)

### 13. Design Classes with TypeScript Best Practices

- Use access modifiers (`private`, `protected`, `public`) explicitly and meaningfully
- Prefer composition over inheritance for better type safety and maintainability
- Implement proper constructor parameter properties: `constructor(private readonly id: string)`
- Use abstract classes and interfaces to define contracts and prevent instantiation
- Apply method overloading for complex method signatures

### 14. Handle Asynchronous Code with Proper Typing

- Always type async functions with explicit return types: `async function fetchUser(): Promise<User>`
- Use `Promise.all()` for concurrent operations with proper error handling
- Apply `Promise.allSettled()` for operations where partial failures are acceptable
- Implement proper error handling with typed error classes extending `Error`
- Use `AbortController` and `AbortSignal` typing for cancellable operations

## **Error Handling and Safety Patterns**

### 15. Implement Comprehensive Error Handling Strategies

- Create custom error classes with specific properties and methods
- Use Result/Either patterns for functional error handling: `Result<T, E>`
- Implement proper error boundaries with typed error information
- Use union types for representing success and error states
- Apply proper error logging with contextual information and stack traces

### 16. Design Safe Data Access Patterns

- Use optional chaining and nullish coalescing for safe property access
- Implement proper null/undefined checking with type guards
- Use `NonNullable<T>` utility type when null/undefined are filtered out
- Apply strict null checks configuration and handle all nullable scenarios
- Create safe accessor methods with fallback values

### 17. Validate Data at System Boundaries

- Implement runtime validation for external data with proper typing
- Use schema validation libraries with TypeScript integration (Zod, Yup, Joi)
- Create validation functions that narrow types: `function validateUser(input: unknown): User`
- Apply proper error handling for validation failures
- Use branded types for validated data to prevent mixing with unvalidated data

## **Performance and Bundle Optimization**

### 18. Optimize TypeScript Compilation Performance

- Use project references for large monorepos with `"references"` in `tsconfig.json`
- Enable incremental compilation with proper cache directory configuration
- Use `"skipLibCheck": true` to avoid checking node_modules type definitions
- Configure `"moduleResolution"` and `"baseUrl"` for efficient module resolution
- Apply proper `include` and `exclude` patterns to limit compilation scope

### 19. Implement Code Splitting and Lazy Loading Patterns

- Use dynamic imports with proper typing: `const module = await import('./feature')`
- Implement lazy-loaded components with `React.lazy()` and proper error boundaries
- Create proper type definitions for dynamically loaded modules
- Use code splitting at logical boundaries with proper type preservation
- Apply proper loading states and error handling for dynamic imports

### 20. Design for Tree-Shaking and Bundle Optimization

- Use ES modules with side-effect-free imports and exports
- Avoid default exports that prevent proper tree-shaking
- Create properly structured barrel exports that don't import everything
- Use `"sideEffects": false` in package.json when appropriate
- Apply proper import techniques to minimize bundle size

## **Testing and Documentation**

### 21. Write Type-Safe Tests with Proper Test Utilities

- Type test fixtures and mock data with proper interfaces
- Use `jest.MockedFunction<typeof fn>` for properly typed mocks
- Create custom test matchers with proper TypeScript definitions
- Apply proper typing for test data builders and factories
- Test error scenarios with typed error assertions and proper error types

### 22. Document Types and Interfaces Comprehensively

- Use JSDoc comments for all public interfaces, types, and complex functions
- Document generic parameters and constraints with clear examples
- Provide usage examples in documentation for complex type patterns
- Use `@example` tags in JSDoc to show proper usage patterns
- Apply proper versioning and changelog practices for type definitions

### 23. Implement Integration Testing with Proper Types

- Create integration test utilities with proper typing
- Test API contracts with proper request/response typing
- Use contract testing with typed schemas and validation
- Apply proper database testing with typed queries and results
- Test error handling scenarios with proper error type assertions

## **Advanced Patterns and Techniques**

### 24. Implement Advanced Design Patterns with TypeScript

- Use the Builder pattern with fluent interfaces and proper method chaining types
- Implement Observer pattern with proper event typing and subscription management
- Apply Factory patterns with proper generic constraints and type inference
- Use Decorator pattern with proper method signature preservation
- Implement Strategy pattern with proper interface-based abstractions

### 25. Master Template Literal Types and String Manipulation

- Create API endpoint types with template literals: `type Endpoint = \`/api/${string}/\${number}\``
- Use template literal types for CSS-in-JS type safety
- Implement path parameter extraction: `type Params<T> = T extends \`\${string}:\${infer P}/\${infer Rest}\` ? P | Params<Rest> : never`
- Apply string manipulation utilities for type-level string operations
- Create domain-specific languages with template literal types

### 26. Leverage Conditional Types and Type-Level Programming

- Use conditional types for complex type transformations and API design
- Implement recursive types with proper depth limits and base cases
- Create utility types for complex data transformations
- Apply infer keyword for type extraction and manipulation
- Use mapped types with key remapping for advanced transformations

### 27. Implement Proper Configuration and Environment Patterns

- Create strongly-typed configuration objects with proper validation
- Use environment variable typing with proper fallbacks and validation
- Implement feature flag typing with proper conditional logic
- Apply configuration schema validation with TypeScript integration
- Create typed configuration builders with proper method chaining

## **Naming Conventions and Code Style**

### 28. Follow Consistent Naming Conventions

- Use **PascalCase** for interfaces, types, classes, enums, and namespaces
- Apply **camelCase** for variables, functions, methods, and properties
- Use **CONSTANT_CASE** for module-level constants and enum values
- Apply **kebab-case** for file and directory names
- Prefix private class members with underscore (`_`) or use `private` keyword

### 29. Design Meaningful Type and Interface Names

- Use descriptive names that reflect domain concepts, not implementation details
- Prefix interfaces with descriptive terms, avoid generic `I` prefixes
- Use verb-based names for function types: `type EventHandler = (event: Event) => void`
- Apply consistent suffixes for type categories: `UserEntity`, `UserService`, `UserRepository`
- Create self-documenting generic parameter names: `TData`, `TError`, `TContext`

### 30. Maintain Consistent Code Formatting and Style

- Use Prettier with TypeScript-specific configuration for consistent formatting
- Configure ESLint with `@typescript-eslint` rules for code quality enforcement
- Apply consistent indentation (2 spaces) and line length (100-120 characters)
- Use trailing commas in multi-line structures for better diffs
- Maintain consistent import organization and formatting
