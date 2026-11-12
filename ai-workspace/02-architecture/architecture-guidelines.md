# SaaS-O-Matic: Directrices de Arquitectura Técnica
**Proyecto:** SaaS-O-Matic (Dynamic Billing & Subscription Optimizer)  
**Versión:** 1.0.0  
**Enfoque:** Clean Architecture / Hexagonal (Ports & Adapters) + Reactive Frontend (Signals)  
**Pila Tecnológica:** Backend NestJS (TypeScript + SQLite + TypeORM) | Frontend Angular 21 (Standalone + Signals)  

---

## 1. Principios de Diseño y Filosofía del Sistema

Para garantizar mantenibilidad, testabilidad y aislamiento estricto de las reglas de negocio, SaaS-O-Matic sigue los principios de **Arquitectura Hexagonal (Puertos y Adaptadores)** en el backend y un **patrón reactivo unidireccional impulsado por Signals** en el frontend.

### Reglas de Oro de Arquitectura
1. **El Dominio es Inmaculado:** El núcleo de negocio se implementa en TypeScript puro. No contiene dependencias, librerías externas ni decoradores de frameworks (`@Injectable`, `@Entity`, `@Column`, `@Get`, etc.).
2. **Inversión de Dependencias (DIP) y Nomenclatura Explícita:** 
   - `application/ports/in/`: Contratos de casos de uso ejecutados por los adaptadores primarios.
   - `application/ports/out/`: Contratos de persistencia/servicios externos requeridos por la aplicación.
   - `infrastructure/adapters/in/rest/`: Controladores NestJS y DTOs HTTP.
   - `infrastructure/adapters/out/persistence/`: Entidades y repositorios TypeORM/SQLite.
3. **Módulo como Orquestador (Wiring):** Los archivos de módulo de NestJS (`customers.module.ts`, `simulations.module.ts`) residen en la raíz de cada módulo para actuar como orquestadores de las tres capas (dominio, aplicación e infraestructura).
4. **Capa Transversal (`src/shared/`):** La carpeta `shared/` se sitúa en la raíz de `src/`, fuera de `modules/`, agrupando excepciones genéricas de dominio y filtros globales como el manejador RFC 7807.
5. **Código en Inglés, Documentación en Español:** Nombres de clases, variables, interfaces, tests y commits se escriben en inglés canónico. La documentación, explicaciones y bitácoras se redactan en español.
6. **Estandarización de Errores:** Ninguna excepción interna escapa sin ser transformada al estándar **IETF RFC 7807 Problem Details** (`application/problem+json`).

---

## 2. Arquitectura del Backend (NestJS + TypeScript)

### 2.1 Modelo de Capas Hexagonales

```
┌────────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE LAYER                          │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ Primary Adapters (in/rest):   │  │ Secondary Adapters (out/db):  │  │
│  │ - NestJS Controllers          │  │ - TypeORM Entities            │  │
│  │ - HTTP DTOs & Pipes           │  │ - SQLite Persistence Adapters │  │
│  │ - REST Mappers                │  │ - Persistence Mappers         │  │
│  └───────────────┬───────────────┘  └───────────────▲───────────────┘  │
└──────────────────┼──────────────────────────────────┼──────────────────┘
                   │                                  │ Implements
                   ▼ Calls In-Ports                   │ Out-Ports
┌─────────────────────────────────────────────────────┴──────────────────┐
│                           APPLICATION LAYER                            │
│  - Ports In:  Use Case Interfaces (e.g., CreateCustomerUseCase)        │
│  - Ports Out: Repository Interfaces (e.g., CustomerRepositoryPort)     │
│  - Services:  Use Case Orchestration Services                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Orchestrates
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             DOMAIN LAYER                               │
│       (Pure TypeScript - Zero Framework & Zero DB Dependencies)        │
│  - Entities: Customer, Simulation                                      │
│  - Value Objects: TaxId, CountryCode                                   │
│  - Domain Services: PricingEngineService, SpanishFiscalValidator       │
│  - Domain Exceptions: InvalidFiscalIdException, etc.                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Estructura Canónica de Directorios del Backend (`api/`)

```text
api/
├── src/
│   ├── modules/
│   │   ├── customers/
│   │   │   ├── domain/                                      # DOMINIO PURO
│   │   │   │   ├── entities/
│   │   │   │   │   └── customer.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── tax-id.vo.ts                         # Normalización y validación
│   │   │   │   ├── services/
│   │   │   │   │   └── spanish-fiscal.validator.ts          # Algoritmos DNI / NIE / CIF
│   │   │   │   └── exceptions/
│   │   │   │       ├── invalid-fiscal-id.exception.ts
│   │   │   │       ├── customer-not-found.exception.ts
│   │   │   │       └── customer-conflict.exception.ts
│   │   │   ├── application/                                 # APLICACIÓN
│   │   │   │   ├── ports/
│   │   │   │   │   ├── in/                                  # Casos de uso (interfaces)
│   │   │   │   │   │   ├── create-customer.use-case.ts
│   │   │   │   │   │   ├── list-customers.use-case.ts
│   │   │   │   │   │   └── get-customer-detail.use-case.ts
│   │   │   │   │   └── out/                                 # Repositorios (interfaces)
│   │   │   │   │       └── customer-repository.port.ts
│   │   │   │   └── services/                                # Implementación de casos de uso
│   │   │   │       └── customer-application.service.ts
│   │   │   ├── infrastructure/                              # INFRAESTRUCTURA
│   │   │   │   └── adapters/
│   │   │   │       ├── in/
│   │   │   │       │   └── rest/
│   │   │   │       │       ├── customer.controller.ts
│   │   │   │       │       ├── dto/
│   │   │   │       │       │   ├── create-customer.dto.ts
│   │   │   │       │       │   └── customer-response.dto.ts
│   │   │   │       │       └── customer-rest.mapper.ts
│   │   │   │       └── out/
│   │   │   │           └── persistence/
│   │   │   │               ├── customer.typeorm-entity.ts
│   │   │   │               ├── customer-persistence.adapter.ts
│   │   │   │               └── customer-persistence.mapper.ts
│   │   │   └── customers.module.ts                          # Ensamblaje / Wiring del módulo
│   │   │
│   │   └── simulations/
│   │       ├── domain/                                      # DOMINIO PURO
│   │       │   ├── entities/
│   │       │   │   └── simulation.entity.ts
│   │       │   ├── services/
│   │       │   │   ├── pricing-engine.service.ts            # Tramos acumulativos
│   │       │   │   └── tax-calculator.service.ts            # Matriz de impuestos y reverse charge
│   │       │   └── exceptions/
│   │       │       └── invalid-simulation-metric.exception.ts
│   │       ├── application/                                 # APLICACIÓN
│   │       │   ├── ports/
│   │       │   │   ├── in/
│   │       │   │   │   └── create-simulation.use-case.ts
│   │       │   │   └── out/
│   │       │   │       └── simulation-repository.port.ts
│   │       │   └── services/
│   │       │       └── simulation-application.service.ts
│   │       ├── infrastructure/                              # INFRAESTRUCTURA
│   │       │   └── adapters/
│   │       │       ├── in/
│   │       │       │   └── rest/
│   │       │       │       ├── simulation.controller.ts
│   │       │       │       ├── dto/
│   │       │       │       │   ├── create-simulation.dto.ts
│   │       │       │       │   └── simulation-response.dto.ts
│   │       │       │       └── simulation-rest.mapper.ts
│   │       │       └── out/
│   │       │           └── persistence/
│   │       │               ├── simulation.typeorm-entity.ts
│   │       │               ├── simulation-persistence.adapter.ts
│   │       │               └── simulation-persistence.mapper.ts
│   │       └── simulations.module.ts                        # Ensamblaje / Wiring del módulo
│   │
│   ├── shared/                                              # TRANSVERSAL GLOBAL
│   │   ├── domain/
│   │   │   └── domain.exception.ts
│   │   └── infrastructure/
│   │       ├── filters/
│   │       │   └── problem-detail-exception.filter.ts       # Filtro global RFC 7807
│   │       └── persistence/
│   │           └── typeorm-sqlite.config.ts
│   │
│   ├── app.module.ts
│   └── main.ts
├── test/
├── jest.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Arquitectura del Frontend (Angular 21)

### 3.1 Patrón Arquitectónico: Componentes Standalone y Signals

```text
dashboard/
├── src/
│   ├── app/
│   │   ├── core/                                            # Core transversal
│   │   │   ├── models/
│   │   │   │   ├── customer.model.ts
│   │   │   │   ├── simulation.model.ts
│   │   │   │   └── problem-detail.model.ts
│   │   │   ├── services/
│   │   │   │   ├── customer-api.service.ts
│   │   │   │   ├── simulation-api.service.ts
│   │   │   │   └── currency.service.ts                      # Integración tipo de cambio, caché y fallback
│   │   │   └── utils/
│   │   │       └── local-pricing-calculator.ts              # Proyección local inmediata en slider
│   │   │
│   │   ├── features/
│   │   │   ├── customers/
│   │   │   │   ├── components/
│   │   │   │   │   ├── customer-card/                       # Dumb Component: tarjeta responsive
│   │   │   │   │   └── customer-search-bar/                 # Dumb Component: input con debounce
│   │   │   │   └── pages/
│   │   │   │       ├── customer-list/                       # Smart Page: buscador y listado
│   │   │   │       └── customer-detail/                     # Smart Page: ficha + historial + simulación
│   │   │   │
│   │   │   └── simulations/
│   │   │       └── components/
│   │   │           ├── simulation-slider/                   # Dumb Component: control interactivo
│   │   │           ├── simulation-projection/               # Dumb Component: desglose de costes en vivo
│   │   │           └── simulation-history-list/             # Dumb Component: tabla/cards de simulaciones
│   │   │
│   │   ├── shared/                                          # Componentes UI reutilizables
│   │   │   ├── components/
│   │   │   │   ├── currency-selector/                       # Selector EUR, USD, GBP con Signal
│   │   │   │   └── error-banner/                            # Banner renderizador de RFC 7807
│   │   │   └── pipes/
│   │   │       └── localized-currency.pipe.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   └── styles.scss                                          # CSS Grid / Flexbox responsive
├── angular.json
├── package.json
└── tsconfig.json
```

---

## 4. Estrategia de Testing y Aseguramiento de Calidad

### 4.1 Pirámide de Pruebas
1. **Tests Unitarios de Dominio (Jest):**
   - Cobertura total de:
     - `SpanishFiscalValidator` (DNI, NIE y CIF válidos/inválidos con algoritmo real y normalización).
     - `PricingEngineService` (casos canónicos $u=0, 10, 15, 50, 60$).
     - `TaxCalculatorService` (ES 21%, DE 19%, FR 20%, IT 22%, GB 20%, US 0%, resto UE 0%, resto mundo 0%).
2. **Tests de Casos de Uso:**
   - Mocks de puertos secundarios (`CustomerRepositoryPort`, `SimulationRepositoryPort`).
   - Verificación de flujo y excepciones de dominio.
3. **Tests de Integración de Adaptadores:**
   - Persistencia SQLite en memoria.
   - Filtro de excepciones RFC 7807 comprobando la cabecera `application/problem+json`.

---

## 5. Estrategia de Commits y Bitácora Paso a Paso

Cada módulo se desarrolla, se prueba con Jest, se audita en `03-vibe-coding-log` y se consolida en Git con commits atómicos:

| Commit | Mensaje de Commit Estándar | Fichero/Módulo Afectado | Documentación Asociada |
| :---: | :--- | :--- | :--- |
| **01** | `docs: add functional specs v1.0.0` | `01-specs/functional-specs.md` | Entrada 01 y 03 |
| **02** | `docs: add openapi contract` | `01-specs/openapi.yaml` | Entrada 02 |
| **03** | `docs: add architecture guidelines with hexagonal ports and adapters` | `02-architecture/architecture-guidelines.md` | Entrada 04 |
| **04** | `feat(api): add spanish fiscal validator with strict algorithms and unit tests` | `modules/customers/domain/services/` | Entrada 05 |
| **05** | `feat(api): add tiered pricing engine and tax calculator with unit tests` | `modules/simulations/domain/services/` | Entrada 06 |
| **06** | `feat(api): add customers module with hexagonal architecture and sqlite persistence` | `modules/customers/` | Entrada 07 |
| **07** | `feat(api): add simulations module with persistence and customer relationship` | `modules/simulations/` | Entrada 08 |
| **08** | `feat(api): add rfc-7807 problem detail global exception filter` | `shared/infrastructure/filters/` | Entrada 09 |
| **09** | `feat(dashboard): scaffold angular 21 app with signals and standalone layout` | `dashboard/` | Entrada 10 |
| **10** | `feat(dashboard): add customer search, responsive cards and detail view` | `dashboard/src/app/features/customers` | Entrada 11 |
| **11** | `feat(dashboard): add interactive simulation slider and multi-currency exchange rate integration` | `dashboard/src/app/features/simulations` | Entrada 12 |
| **12** | `ci/deploy: add docker-compose and comprehensive readme with local and docker execution` | `docker-compose.yml`, `README.md` | Entrada 13 |
