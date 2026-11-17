# SaaS-O-Matic: Coding Standards & Architecture Rules

This rule enforces the architectural and quality standards of SaaS-O-Matic.
Refer to [AGENTS.md](../../AGENTS.md) at the repository root for the comprehensive specification.

## Core Directives
1. **SSOT Design Tokens**: No hardcoded hex colors or fallback arguments in `var()` (e.g., `var(--roams-token)` only). Source of truth: `src/styles/_colors.scss`.
2. **Hexagonal Backend**: Clean domain layer with zero framework dependencies. All use cases defined via Ports & Adapters.
3. **Dirty Validation**: Use `ShowOnDirtyErrorStateMatcher` for real-time validation on typing (`control.dirty`).
4. **W3C Semantics**: Use native `<output>` instead of `<div role="status">` for accessibility notices.
5. **Quality Gate**: 0 warnings and 0 errors in Oxlint, 100% test passing rate across all suites.
6. **Synchronous Markdown Audit**: Every prompt, architectural decision, and UI refinement must be logged in `ai-workspace/` and synchronized across all project Markdown files for the technical evaluation committee.
