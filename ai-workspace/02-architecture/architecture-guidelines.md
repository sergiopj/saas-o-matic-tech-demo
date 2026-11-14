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
7. **Soberanía del Dominio sobre Fechas y Precisión Financiera:**
   - Las entidades de dominio originan y gobiernan sus propios timestamps (`createdAt: new Date()`). En infraestructura, TypeORM utiliza `@Column('datetime')` en lugar de `@CreateDateColumn` para no sobrescribir ni desincronizar los ciclos de vida del dominio.
   - Todo importe monetario se persiste con `@Column('decimal', { precision: 10, scale: 2 })` (y `scale: 4` en tasas) para prevenir errores de coma flotante IEEE 754 de los tipos `float`.
8. **Concurrencia de Base de Datos en Modo WAL (Write-Ahead Logging):** Para garantizar alto rendimiento y evitar contención en SQLite, la persistencia se configura con `enableWAL: true`. En modo WAL, las lecturas no bloquean a las escrituras y las escrituras no bloquean a las lecturas, permitiendo que múltiples usuarios consulten clientes mientras se registran simulaciones concurrentes.


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

### 2.2 Estructura Canónica de Directorios del Backend (`mic-saas-omatic/`)

```text
mic-saas-omatic/
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

### 2.3 Decisiones de Rendimiento y Concurrencia (Evaluación de Palancas Enterprise)

Frente a modelos como Java/Spring Boot (que requieren habilitar Virtual Threads para evitar la saturación del modelo thread-per-request), Node.js opera de forma asíncrona no bloqueante mediante el Event Loop. No obstante, se han evaluado las 3 palancas clásicas de rendimiento en backend:

| Palanca de Rendimiento | Decisión | Justificación Técnica Senior |
| :--- | :---: | :--- |
| **A. Motor HTTP (Fastify vs Express)** | **Descartada** (Se mantiene Express) | NestJS incluye Express por defecto, capaz de procesar >10.000 req/s. Migrar a Fastify añadiría complejidad innecesaria sin aportar beneficio medible al volumen de uso comercial interno. |
| **B. Concurrencia SQLite (Modo WAL)** | **APLICADA** (`enableWAL: true`) | SQLite por defecto usa *Rollback Journal*, bloqueando a los lectores durante las escrituras. Con WAL (*Write-Ahead Logging*), las lecturas concurrentes nunca bloquean las escrituras ni viceversa. |
| **C. Multi-núcleo / Clustering** | **Descartada** (1 proceso Node.js) | En entornos con SQLite como base de datos embebida monoproceso, levantar múltiples procesos Node.js compitiendo por el archivo bloquea el driver. Un único proceso Node.js con `better-sqlite3` es la arquitectura óptima. |

### 2.4 Gestión de Configuración Multi-entorno y Variables de Entorno

Siguiendo el estándar *The Twelve-Factor App* (Factor III: Configuración):
1. **Backend (`mic-saas-omatic`):**
   - Soporte nativo de ficheros `.env` mediante `process.loadEnvFile()` de Node.js 20.6+ sin librerías externas superfluas.
   - Plantilla versionada [`.env.example`](../../mic-saas-omatic/.env.example) y valores por defecto tolerantes a fallos (`PORT: 3000`, `DATABASE_NAME: saas_o_matic.sqlite`).
2. **Frontend (`spa-saas-omatic`):**
   - Desacoplamiento de entorno cliente mediante Angular `src/environments/` (`environment.ts` para producción y `environment.development.ts` para desarrollo local).
   - Inyección de dependencias centralizada: ningún servicio o componente consume URLs literales.
3. **Orquestación Global (Docker Compose):**
   - Plantilla [`.env.example`](../../.env.example) en la raíz para unificar los puertos de publicación y las rutas de base de datos entre contenedores.

---

## 3. Arquitectura del Frontend (Angular 22)

### 3.1 Patrón Arquitectónico: Componentes Standalone y Signals

```text
spa-saas-omatic/
├── src/
│   ├── app/
│   │   ├── core/                                            # Infraestructura transversal de la aplicación
│   │   │   ├── errors/
│   │   │   │   ├── problem-detail.model.ts                  # Formato estándar de error RFC 7807 (application/problem+json)
│   │   │   │   └── error.interceptor.ts                     # HttpInterceptor funcional global (normaliza errores a ProblemDetail)
│   │   │   ├── i18n/
│   │   │   │   └── translations.ts                          # Catálogo de traducciones bilingüe (es/en) fuertemente tipado
│   │   │   ├── models/
│   │   │   │   └── currency.model.ts                        # CurrencyCode (as const), CurrencyOption y ExchangeRateApiResponse
│   │   │   └── services/
│   │   │       ├── currency.service.ts                      # Integración open.er-api.com, caché en memoria y Signals
│   │   │       └── i18n.service.ts                          # Servicio reactivo de localización con Signals y detección de navegador
│   │   │
│   │   ├── modules/                                         # Módulos de dominio funcionales (Simetría 1:1 con backend)
│   │   │   ├── customers/                                   # Bounded Context de Clientes (modules/customers)
│   │   │   │   ├── models/
│   │   │   │   │   └── customer.model.ts                    # Customer y CustomerCreate
│   │   │   │   ├── services/
│   │   │   │   │   └── customer-api.service.ts              # GET /customers, GET /customers/:id
│   │   │   │   ├── components/
│   │   │   │   │   ├── customer-card/                       # Dumb Component: tarjeta responsive
│   │   │   │   │   └── customer-search-bar/                 # Dumb Component: input con debounce
│   │   │   │   └── pages/
│   │   │   │       ├── customer-list/                       # Smart Page: buscador y grid de clientes
│   │   │   │       └── customer-detail/                     # Smart Page: ficha + historial + simulación
│   │   │   │
│   │   │   └── simulations/                                 # Bounded Context de Simulaciones (modules/simulations)
│   │   │       ├── models/
│   │   │       │   └── simulation.model.ts                  # Simulation, SimulationCreate y SimulationProjection
│   │   │       ├── services/
│   │   │       │   └── simulation-api.service.ts            # POST /simulations, GET /simulations?customerId=
│   │   │       ├── utils/
│   │   │       │   └── local-pricing-calculator.ts          # Proyección local inmediata de tramos en slider
│   │   │       └── components/
│   │   │           ├── simulation-slider/                   # Dumb Component: control interactivo accesible
│   │   │           ├── simulation-projection/               # Dumb Component: desglose de costes en vivo
│   │   │           └── simulation-history-list/             # Dumb Component: tabla/cards de simulaciones
│   │   │
│   │   ├── shared/                                          # Componentes UI reutilizables
│   │   │   ├── components/
│   │   │   │   ├── navbar/                                  # Navbar corporativa estilo Roams
│   │   │   │   ├── currency-selector/                       # Selector EUR, USD, GBP con Signal reactivo
│   │   │   │   └── error-banner/                            # Banner visual renderizador de RFC 7807
│   │   │   └── pipes/
│   │   │       └── localized-currency.pipe.ts               # Pipe i18n con Intl.NumberFormat y metadatos nativos por país
│   │   │
│   │   ├── app.ts                                           # Shell de aplicación con Standalone Components
│   │   ├── app.html                                         # Layout con Navbar + <router-outlet />
│   │   ├── app.config.ts                                    # Configuración global (provideHttpClient, Router)
│   │   └── app.routes.ts                                    # Configuración de rutas con Lazy Loading
│   ├── index.html
│   ├── styles/                                              # Arquitectura modular SCSS (Patrón 7-1)
│   │   ├── _colors.scss                                     # Paleta corporativa Roams + Design Tokens :root
│   │   └── _variables.scss                                  # Radios y elevación de sombras
│   └── styles.scss                                          # Orquestador SCSS raíz (@use 'colors', 'variables')
├── angular.json
├── package.json
└── tsconfig.json
```

### 3.2 Sistema de Diseño, UI y Design Tokens Corporativos (Angular Material + SCSS Modular)
- **UI Framework:** Angular Material. Se elige porque el Dashboard necesita slider, formularios, select de divisa y tarjetas con accesibilidad nativa (a11y) y componentes probados desde el minuto uno, sin tener que construir el slider desde cero.
- **Arquitectura Modular de Estilos SCSS (Patrón 7-1 / Single Source of Truth):**
  En lugar de mezclar declaraciones de diseño en el archivo global `styles.scss`, los estilos se desacoplan en parciales dedicados con responsabilidad única:
  - `src/styles/_colors.scss`: Define las variables SCSS (`$roams-*`) y proyecta el catálogo de Design Tokens a variables CSS Custom Properties (`--roams-*`) en `:root`.
  - `src/styles/_variables.scss`: Centraliza radios de curvatura (`--roams-radius-*`) y matrices de elevación y sombra (`--roams-shadow-*`).
  - `src/styles.scss`: Actúa exclusivamente como orquestador raíz limpio, importando los parciales mediante `@use './styles/colors'` y `@use './styles/variables'`.
  - `angular.json`: Se configura `stylePreprocessorOptions.includePaths: ["src/styles"]`, permitiendo a cualquier componente importar `@use 'colors'` directamente sin rutas relativas frágiles (`../../styles`).
- **Design Tokens Corporativos Roams (`--roams-*`):** Inspirados en la identidad visual de `roams.es`, en `_colors.scss` se centraliza la paleta corporativa:
  - `--roams-primary`: `#0F172A` (Azul marino cabecera / fondo oscuro)
  - `--roams-accent-blue`: `#1061E2` (Azul real Roams)
  - `--roams-accent-cyan`: `#0EA5E9` (Cian de acento y feedback)
  - `--roams-status-success`: `#10B981` (Verde esmeralda para ahorros y sincronización)
  - `--roams-status-warning`: `#F59E0B` (Ámbar de contingencia y alertas)
  - `--roams-status-error`: `#EF4444` (Rojo de error RFC 7807)
  - Superficies: `--roams-bg-page` (`#F8FAFC`), `--roams-bg-card` (`#FFFFFF`).
  - Geometría: `--roams-radius-lg` (`16px` para tarjetas Roams).
- **Cascada Nativa y Cero Hardcodeo:** Queda terminantemente prohibido incluir valores hexadecimales directos en los archivos `.scss` de los componentes. Todos los colores bajan en cascada nativa mediante `var(--roams-*)`.
- **Layout y Responsive:** Flexbox y CSS Grid nativo + clases de Material, sin Bootstrap, para no mezclar dos sistemas de layout.

### 3.3 Estrategia de Divisas y Escalabilidad (Open/Closed Principle)

- **Caché Completa de la API:** La API externa (`https://open.er-api.com/v6/latest/EUR`) devuelve más de 160 tipos de cambio. `CurrencyService` almacena el diccionario completo en memoria (`rates`), por lo que la aplicación ya dispone de las tasas de cualquier divisa mundial sin peticiones HTTP adicionales.
- **Catálogo Controlado (UX Whitelist):** En lugar de abrumar al equipo comercial con 160 opciones en el desplegable, `SUPPORTED_CURRENCIES` acota el selector a las divisas operativas estratégicas del mercado SaaS (`EUR`, `USD`, `GBP`, `CHF`, `CAD`, `JPY`).
- **Extensibilidad Abierta/Cerrada:** Incorporar una nueva divisa comercial (ej. `AUD` o `MXN`) requiere únicamente añadir su código a la tupla `SUPPORTED_CURRENCIES`.
- **Formateo Universal con Fallback `Intl`:** Si se solicita formatear una divisa no registrada en `CURRENCY_METADATA`, el pipe `LocalizedCurrencyPipe` recurre de forma transparente al motor nativo `Intl.NumberFormat` de ECMAScript (`meta?.locale` y `meta?.decimals` como `undefined`), infiriendo automáticamente el símbolo oficial, el número canónico de decimales y el orden según el locale del navegador del usuario.

### 3.4 Estándares de Plantillas: Built-in Control Flow (`@if`, `@for`)

Se prescribe el uso exclusivo del nuevo flujo de control nativo de Angular 22:
- **`@if / @else if / @else`**: Sustituye a `*ngIf` con `<ng-template>`, permitiendo evaluar directamente las funciones de señales (`loading()`, `error()`) sin hacks reactivos.
- **`@for (...; track ...)`**: Sustituye a `*ngFor` y exige `track` obligatorio por compilador, garantizando una reconciliación quirúrgica del DOM sin destrucción de nodos.
- **Descarte de `CommonModule`**: Cero dependencias de directivas estructurales legacy en componentes Standalone, optimizando el tamaño del bundle y el type-checking estricto de plantillas.

### 3.5 Internacionalización Reactiva y Desacoplamiento de Textos (`I18nService`)

Para mantener el principio de código en inglés y desacoplar la lógica de la presentación:
- **Cero Textos Hardcodeados:** Se prohíbe introducir cadenas literales de texto en clases TypeScript o plantillas HTML. Todas las etiquetas, tooltips y textos de accesibilidad (`aria-label`) se definen de forma centralizada en `src/app/core/i18n/translations.ts`.
- **Tipado Estricto de Claves (`TranslationKey`):** El compilador de TypeScript valida que cualquier clave solicitada mediante `i18n.t(key)` exista en el diccionario en ambos idiomas (`es` y `en`), previniendo erratas tipográficas en tiempo de compilación.
- **Detección Automática con Fallback Regional:** `I18nService` inspecciona `navigator.language` para adaptarse automáticamente a entornos internacionales, manteniendo el español (`'es'`) como idioma predeterminado de la plataforma.
- **Reactividad con Signals:** El idioma activo se almacena en una Signal `currentLanguage`, provocando el recálculo instantáneo de cualquier vista o mensaje reactivo sin necesidad de recargar la aplicación.

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
3. **Tests de Integración y E2E (Jest + Supertest):**
   - Base de datos SQLite real aislada (`saas_o_matic.test.sqlite`) ejecutada de forma secuencial (`maxWorkers: 1`).
   - Ciclo de vida HTTP completo: `ValidationPipe` (whitelist + forbidNonWhitelisted), filtro global RFC 7807 (`application/problem+json`), casos de uso y repositorios `better-sqlite3`.
4. **Higiene y Política de Salida Limpia en Tests (Zero-Stderr Policy):**
   - En pruebas de resiliencia y contingencia de red, los logs defensivos esperados (`console.warn`) son interceptados y verificados con espías de Vitest (`vi.spyOn`), garantizando que la salida de pruebas para el evaluador esté libre de trazas de error confusas en la consola.

### 4.2 Scripts de Ejecución y Filosofía de Feedback Loops

Para optimizar los tiempos de respuesta durante el desarrollo y asegurar la máxima calidad en los despliegues, se adopta una política de separación de responsabilidades en la ejecución de tests:

#### A. Backend (`mic-saas-omatic`):
| Comando | Tipo de Suite | Ámbito / Propósito | Tiempo de Ejecución |
| :--- | :--- | :--- | :--- |
| `npm test` | **Unitarios** | Dominio puro, casos de uso con mocks, mappers y controladores aislados. Feedback continuo durante el desarrollo local (`test:watch`). | Sub-segundo (< 1s) |
| `npm run test:e2e` | **Integración E2E** | Pipeline HTTP completo contra base de datos SQLite real y filtro RFC 7807. Validación de integración entre capas. | ~3-4 segundos |
| `npm run test:all` | **Suite Completa** | Ejecución encadenada (`npm test && npm run test:e2e`). Puerta de calidad obligatoria antes de commits, PRs y pipelines de CI/CD. | ~4-5 segundos |

#### B. Frontend (`spa-saas-omatic`):
| Comando | Tipo de Suite | Ámbito / Propósito | Tiempo de Ejecución |
| :--- | :--- | :--- | :--- |
| `npm test` | **Pase Único (Vitest)** | Ejecución determinista de una pasada (`ng test --watch=false`). Diseñado para evaluación y pipelines de CI/CD. | ~1-2 segundos |
| `npm run test:watch` | **Modo Interactivo** | Recarga en caliente ante cambios de código para desarrollo local. | Continuo |

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
