# mic-saas-omatic — Backend Agent Rules

> **Full specification**: [`../AGENTS.md`](../AGENTS.md) at the repository root is the authoritative source for all architectural, coding, accessibility, and linting rules. This file summarises the backend-specific constraints you must enforce every time you touch this microservice.

---

## 1. Architecture — Hexagonal (Ports & Adapters), Zero Compromise

The domain layer is **pure TypeScript**. No NestJS decorators, no TypeORM imports, no framework coupling of any kind inside `domain/`.

```
mic-saas-omatic/src/
├── modules/
│   ├── customers/
│   │   ├── domain/                  ← Pure TS: Customer entity, tax-id.validator, CustomerSearchCriteria
│   │   ├── application/
│   │   │   ├── ports/in/            ← Use case interfaces (CreateCustomerUseCase, etc.)
│   │   │   └── ports/out/           ← Repository port interfaces (CustomerRepositoryPort)
│   │   └── infrastructure/
│   │       ├── adapters/in/rest/    ← NestJS controllers + class-validator DTOs
│   │       └── adapters/out/persistence/ ← TypeORM entities, adapters, mappers
│   ├── simulations/                 ← Same hexagonal structure
│   └── emails/                      ← SendEmailUseCase + HtmlSanitizerService
└── shared/
    ├── domain/                      ← DomainException base class
    └── infrastructure/
        ├── filters/                 ← ProblemDetailExceptionFilter (RFC 7807)
        └── persistence/             ← TypeORM config (WAL), DatabaseSeederService
```

---

## 2. Domain Rules — Non-Negotiable Invariants

- **Tax ID validation**: `tax-id.validator.ts` implements the official AEAT algorithm (Real Decreto 1065/2007) for ES (DNI, NIE, CIF) and strict jurisdiction-specific formats for DE, FR, IT, US. Never use a generic alphanumeric regex as the sole validator for a catalogued country.
- **Tiered pricing authority**: `PricingEngineService` owns `calculateTieredPrice` using the immutable `PRICING_TIERS` tuple in `fiscal.constants.ts`. The frontend never sends price values — the backend is the sole fiscal authority.
- **Tax rates by country**: `TaxCalculatorService` resolves `taxRate` from `TAX_RATES` (ES 21%, DE 19%, FR 20%, IT 22%, GB 20%, US 0%, rest 0% Reverse Charge). Never hardcode a tax rate outside this map.
- **Monetary precision**: All currency columns use `@Column('decimal', { precision: 10, scale: 2 })`. Rate columns use `scale: 4`. Never use `float` or `number` for financial persistence.
- **DRY invariants**: Validation logic lives in `private static validate*` helpers inside the entity class. `create()` and `update()` orchestrate under 10 lines each.

---

## 3. API Contract — REST Endpoints

| Method | Route | Description |
|:---|:---|:---|
| `POST` | `/customers` | Create corporate customer with fiscal validation |
| `GET` | `/customers` | Paginated list — query: `search`, `country`, `page`, `limit`, `sortBy`, `order` |
| `GET` | `/customers/:id` | Customer detail |
| `PATCH` | `/customers/:id` | Partial update — 409 on taxId collision, invariants re-validated |
| `GET` | `/simulations` | Simulation history by `?customerId=` (required) |
| `POST` | `/simulations` | Persist simulation — backend computes all costs |
| `POST` | `/emails/send` | Dispatch commercial proposal — anti-XSS sanitization mandatory |

**Pagination headers** on `GET /customers`: `X-Total-Count`, `X-Page`, `X-Limit`, `X-Total-Pages` (exposed via `Access-Control-Expose-Headers`).

**All `4xx`/`5xx` responses** must conform to RFC 7807 `application/problem+json`. Use `ProblemDetailExceptionFilter` — never return raw NestJS error objects.

---

## 4. DTO & Controller Rules

- Import DTOs as **concrete value classes** (`import { CreateCustomerDto }`), never `import type`. NestJS `reflect-metadata` requires the runtime symbol for `ValidationPipe` to work.
- Use `class-validator` + `class-transformer` with `@Type(() => Number)`, `@IsInt()`, `@Min(1)` for query DTOs. Never manually coerce with `parseInt` inside controller methods.
- Do not create empty Value Object files (`.vo.ts`) for trivial string normalization. Use focused utility functions in the validator service.

---

## 5. Security

- `HtmlSanitizerService` must strip XSS vectors from email HTML **before** any processing. The stripping regex must be strictly linear `O(N)` — no greedy quantifiers (`.*`, `\s*`) without anchoring. Use zero-width word boundaries (`\bon[a-z]+`) against ReDoS.
- Never commit live credentials. Email dispatching uses a transactional domain stub with structured logging.

---

## 6. Quality Gate — Must Pass Before Every Commit

```bash
npm --prefix mic-saas-omatic test      # 187 / 187 Jest tests — 100%
```

- 100% statement, function and line coverage. Branch coverage ≥ 90%.
- All new use cases, validators, mappers and domain methods must have corresponding Jest specs.
- Log every architectural decision in `../ai-workspace/03-vibe-coding-log/prompts-and-audits.md`.
