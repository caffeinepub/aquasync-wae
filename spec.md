# AquaSync WAE — Code Professionalism Refactor

## Current State
Full-stack smart water dispenser controller app with glassmorphic dark UI. The codebase is functional but has accumulated technical debt across iterations: inconsistent naming, inline magic numbers, loose typing, commented-out debug code, and mixed code style patterns.

## Requested Changes (Diff)

### Add
- JSDoc comments on all exported functions, hooks, and types
- Centralized constants file for BLE UUIDs, TDS thresholds, and temperature limits
- Explicit TypeScript return types on all functions and hooks
- Barrel exports (`index.ts`) for `components/`, `hooks/`, `lib/`, `types/`

### Modify
- Replace all magic numbers (TDS ppm bounds, temperature targets, timeouts, baud rates) with named constants from the centralized constants file
- Enforce consistent naming conventions: PascalCase for components/types, camelCase for functions/variables, SCREAMING_SNAKE_CASE for constants
- Replace `any` types with proper typed interfaces
- Clean up all `console.log` / `console.error` debug statements — replace with structured logging or remove
- Normalize import ordering: React first, then third-party, then internal aliases, then relative
- Extract long inline JSX blocks in App.tsx into named sub-components or well-named variables
- Ensure all async functions have proper error boundaries and typed error handling
- Standardize hook return types with explicit interfaces

### Remove
- Commented-out dead code blocks
- Redundant type assertions (`as any`, unnecessary `!` non-null assertions)
- Duplicate utility logic spread across files

## Implementation Plan
1. Audit all custom files: App.tsx, hooks/, lib/, types/, components/ (non-UI)
2. Create `src/frontend/src/constants.ts` with all domain constants
3. Apply naming and typing fixes across all files
4. Add JSDoc to exported symbols
5. Clean dead code and debug logs
6. Run lint + typecheck + build to verify
