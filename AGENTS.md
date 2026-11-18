# SaaS-O-Matic: AI Agent Operational Guidelines & Rules
# Universal Agent Configuration (Antigravity, Cursor, Gemini CLI, Claude Code, GitHub Copilot)

You are an expert full-stack software engineer and architect working on **SaaS-O-Matic (Dynamic Billing & Subscription Optimizer)**.
Whenever you operate in this repository, you MUST strictly adhere to the following architectural, coding, accessibility, and styling rules.

---

## 1. General Principles & Language Policy
- **Code in English**: All classes, variables, methods, interfaces, DTOs, tests, and git commits must be written in canonical, idiomatic English.
- **Documentation in Spanish**: Explanations, architectural logs, and markdown documentation files (`ai-workspace/`) must be written in professional Spanish.
- **Verification First**: After any modification, always execute linting and tests to ensure 0 errors and 0 warnings.
  - Frontend: `npm --prefix spa-saas-omatic run lint` (Oxlint) and `npm --prefix spa-saas-omatic test` (Vitest).
  - Backend: `npm --prefix mic-saas-omatic test` (Jest).

---

## 2. Frontend Guidelines (`spa-saas-omatic` / Angular 22)

### A. Styling & Design Tokens (SSOT in `src/styles/_colors.scss`)
- **Strict Prohibition of Hardcoded Hex Colors**: Never use direct hex color codes (e.g., `#1061e2`, `#64748b`, `#ffffff`) inside component `.scss` files.
- **Strict Prohibition of Variable Fallbacks**: Never declare fallback hex values in CSS variables (e.g., `var(--roams-text-secondary, #64748b)` or `var(--roams-accent-blue, #1061e2)`). Fallbacks violate the Single Source of Truth (SSOT), break theming, and duplicate declarations. Always invoke tokens cleanly: `color: var(--roams-text-secondary);`.
- **Roams Brand Tokens**: Use the official `--roams-*` tokens defined in `src/styles/_colors.scss`:
  - Brand: `--roams-primary`, `--roams-primary-light`, `--roams-primary-dark`, `--roams-accent-blue`, `--roams-accent-blue-hover`, `--roams-accent-cyan`, `--roams-accent-purple`.
  - Surfaces: `--roams-bg-page`, `--roams-bg-card`, `--roams-surface`, `--roams-bg-input-dark`.
  - Typography: `--roams-text-primary`, `--roams-text-secondary`, `--roams-text-muted`, `--roams-text-inverse`.
  - Feedback: `--roams-status-success`, `--roams-status-warning`, `--roams-status-error`, `--roams-status-info`.
  - Borders: `--roams-border`, `--roams-border-light`, `--roams-border-inverse`.
- **Zero Tailwind**: Do not install or introduce Tailwind CSS. Rely exclusively on modular SCSS (7-1 pattern) and Angular Material.

### B. Form Validation & Reactive State
- **Instant Dirty Validation**: Use `ShowOnDirtyErrorStateMatcher` with reactive `FormControl` so validation errors trigger immediately as the user types (`control.dirty`), rather than waiting for blur.
- **Email Validation**: Enforce RFC 5322 regex validation pattern with TLD requirement of at least 2 characters.
- **Accessible Feedback**: Display descriptive `<mat-error>` messages with multi-language i18n support (`es`, `en`, `de`, `fr`).

### C. Web Accessibility (W3C A11y Standards)
- **First Rule of ARIA (Native Elements First)**: Do NOT use `role="status"` on generic `<div>` tags. Use native HTML5 `<output class="..." aria-live="polite">` elements (resolves SonarQube `Web:S6819`).
- Ensure all interactive elements have appropriate ARIA attributes, semantic tags, and keyboard navigation.

### D. Performance & Architecture
- **Signals & Standalone**: Use Angular Signals (`signal`, `computed`, `effect`) and standalone components. Avoid legacy NgModules.
- **Lazy Loading**: Heavy third-party integrations (e.g., Quill rich-text editor) must be lazily loaded in separate chunks to keep the initial main bundle under 165 kB.
- **DOM Containment**: Apply `content-visibility: auto; contain-intrinsic-size: auto 240px;` on repeating card items to maximize 60 FPS rendering in large grids.

---

## 3. Backend Guidelines (`mic-saas-omatic` / NestJS)

### A. Hexagonal Architecture (Ports & Adapters)
- **Immaculate Domain**: Pure TypeScript domain entities, value objects, and domain services. Never import NestJS, TypeORM, or HTTP decorators into the `domain/` layer.
- **Ports & Adapters**:
  - `application/ports/in/`: Use case interfaces.
  - `application/ports/out/`: Repository and external service interfaces.
  - `infrastructure/adapters/in/rest/`: NestJS controllers, request DTOs, and response serializers.
  - `infrastructure/adapters/out/persistence/`: TypeORM entities, repositories, and persistence mappers.

### B. Security & Safe Dispatching
- **Anti-XSS Sanitization**: Sanitize all incoming rich HTML payloads using an OWASP-compliant sanitizer (`HtmlSanitizerService`) before processing or persistence.
- **Safe Transactional Mocking**: For external service dispatching (e.g., email sending, payment gateways), use decoupled transactional domain stubs with structured logging. Never hardcode live third-party credentials or API keys into git repositories.

### C. Database & Fiscal Precision
- **Precision Financials**: Persist all currency values using `@Column('decimal', { precision: 10, scale: 2 })` (and `scale: 4` for rates) to avoid IEEE 754 floating-point inaccuracies.
- **SQLite WAL Mode**: Configure SQLite with `enableWAL: true` for high-concurrency non-blocking reads and writes.
- **Standardized Errors**: Translate all exceptions to IETF RFC 7807 Problem Details (`application/problem+json`).

### D. Anti-Overengineering, Clean Code & Pragmatism
- **No Pretentious Value Objects without Business Behavior**: Do NOT create empty wrapper classes, `.vo.ts` files, or dedicated orphan folders for trivial string trimming or basic regex sanitization. Use clean, focused utility functions within the relevant domain service (e.g., `normalizeTaxId` inside `spanish-fiscal.validator.ts`) unless a Value Object genuinely encapsulates rich invariants and is actively used across entities.
- **Zero Dead Code & Zero Unused Artifacts**: Never create or leave uninstantiated classes, unused interfaces, or orphaned methods. If code is unreferenced, delete it immediately.
- **Single-Purpose Function Signatures**: When refactoring to Parameter Objects (e.g., `CustomerSearchCriteria`), completely eliminate legacy positional parameters and runtime type-sniffing shims (`typeof arg === 'object'`). Keep signatures lean, predictable, and single-purpose.
- **DRY Domain Invariants**: Encapsulate domain validation rules in cohesive private static helper methods within the entity rather than duplicating validation lines across `create()` and `update()`.
- **Information Hiding & Scope**: Do not indiscriminately export helper functions. Export only the public contract of the module; keep internal algorithmic helpers module-private (unexported).
- **Natural Engineering Comments**: Write natural, concise developer comments in English explaining domain constraints without AI-generated boilerplate, robotic academic tones, or decorative comment banners.

---

## 4. Code Quality & Linting
- **Oxlint Compliance**: Run `oxlint --type-aware src/` and ensure zero warnings and zero errors.
- **No Dead Code**: Remove unused imports, dead variables, and redundant comments.
- **Strict Typing**: Avoid `any`. Use strict TypeScript types, discriminated unions, and explicit return types.

---

## 5. Traceability & Markdown Documentation Policy (AI Evaluation Governance)
- **Mandatory Synchronous Logging per Prompt**: Every prompt, architectural decision, UI refinement, and technical change MUST be documented synchronously in the corresponding `.md` files (`ai-workspace/03-vibe-coding-log/prompts-and-audits.md`, `ai-workspace/01-specs/functional-specs.md`, `ai-workspace/02-architecture/architecture-guidelines.md`, and module READMEs).
- **Audit-Ready Vibe Coding Dataset**: Every entry in `prompts-and-audits.md` must record the date, context, human prompt verbatim, architectural solution applied, verification results (Oxlint 0/0, 100% test pass rate), and value for the Roams technical evaluation committee.
