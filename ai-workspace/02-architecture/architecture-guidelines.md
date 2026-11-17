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

### 2.5 Filtrado Server-Side Completo vs. Client-Side (Consistencia de Paginación y Rendimiento SQL)

En sistemas empresariales escalables, el filtrado de entidades de negocio (**empresa, identificador fiscal, email y jurisdicción fiscal por país**) debe ejecutarse obligatoriamente en el **Backend (Server-Side)**:
1. **Fallo de Consistencia en Paginación (*Pagination Loss*):**
   Si la API pagine los clientes (ej. `LIMIT 20 OFFSET 0`) y el frontend filtra en memoria con un `.filter()`, el cliente solo ve los registros de ese país presentes en la página actual (ej. 1 solo resultado), ignorando decenas de coincidencias que residen en las páginas 2, 3 o 10. Al filtrar en el motor de base de datos (`WHERE country = :country`), la consulta devuelve exactamente el conjunto íntegro de resultados coincidentes.
2. **Eficiencia de Red y CPU Cliente:**
   Un catálogo con miles de clientes corporativos saturaría el ancho de banda y la memoria del navegador si exigiera transferir un payload masivo completo. La base de datos resuelve las cláusulas combinadas `LIKE` y equality (`WHERE (company_name LIKE :term OR tax_id LIKE :term) AND country = :country`) en milisegundos mediante índices B-Tree optimizados.
3. **Arquitectura Hexagonal Limpia:**
   - **Inbound Controller:** Recibe query params opcionales `@Query('search') search?: string, @Query('country') country?: string`.
   - **Use Case:** Orquesta la llamada pasando ambos criterios de forma desacoplada al puerto de salida.
   - **Outbound Persistence Adapter:** Compone dinámicamente las ramas `where` de TypeORM según los filtros activos (`ALL`, país específico, búsqueda textual o ambos combinados) ordenando por `createdAt DESC`.

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
│   │   │   │   └── currency.model.ts                        # CurrencyCode (as const), CURRENCY_METADATA, DEFAULT_FALLBACK_RATES y ExchangeRateApiResponse (SSOT)
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
│   │   │   │   ├── language-selector/                       # Menú flotante mat-menu con flags y OCP
│   │   │   │   ├── loading-state/                           # Estado de carga accesible reutilizable
│   │   │   │   └── error-banner/                            # Banner visual renderizador de RFC 7807
│   │   │   └── pipes/
│   │   │       ├── localized-currency.pipe.ts               # Pipe i18n con Intl.NumberFormat y metadatos nativos por país
│   │   │       └── translate.pipe.ts                        # Pipe declarativo de traducción reactiva con Signals
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
- **Diseño Mobile-First y Responsividad Total:**
  - Toda la interfaz (Navbar, buscador, tarjetas, modal/vistas y slider) se diseña bajo enfoque **Mobile-First**: el layout base se concibe para pantallas móviles compactas (`320px` - `480px`), adaptándose de forma progresiva a tablets (`768px`) y escritorio (`1024px` - `1440px+`).
  - Empleo exclusivo de **CSS Flexbox y CSS Grid elástico** (`grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`), garantizando cero scrollbars horizontales no deseados (`overflow-x: hidden` en contenedor principal) y wrapping fluido de controles de acción.
  - Sin dependencias de frameworks CSS pesados (Bootstrap o Tailwind): 100% estilos nativos y Angular Material para mantener el bundle ultraligero (< 50 kB inicial).
- **Micro-interacciones y Animaciones Fluidas (Core Web Vitals):**
  - **Entrada suave de tarjetas:** Cada tarjeta `CustomerCard` entra con una animación suave de opacidad y desplazamiento (`opacity: 0 -> 1`, `translateY: 10px -> 0`) mediante aceleración Material `cubic-bezier(0.16, 1, 0.3, 1)` de 350ms, evitando apariciones bruscas.
  - **Feedback táctil en buscador:** El input de búsqueda muestra un `<mat-spinner diameter="18">` contextual durante el debounce y la petición, informando al usuario en su foco de visión.
  - **Transición no destructiva del Grid (`.is-searching`):** Mientras se filtra sobre resultados existentes, el grid atenúa su opacidad (`opacity: 0.45; transition: opacity 0.25s ease;`) en lugar de destruirse, erradicando el Cumulative Layout Shift (CLS).
  - **Blindaje de la Carga Inicial (`initialLoading`):** Se controla el estado de carga inicial para asegurar que el spinner central se muestra de forma limpia antes de renderizar el primer lote de datos, impidiendo destellos del estado vacío.
- **Virtualización Nativa del DOM para Grids Masivos (`content-visibility: auto`):**
  - En un Grid CSS elástico y responsive (`repeat(auto-fill, minmax(320px, 1fr))`), el uso de componentes tradicionales como `cdk-virtual-scroll-viewport` introduce serios problemas: está diseñado para listas unidimensionales de altura fija y genera saltos visuales (*glitches*) al variar el número de columnas según la pantalla.
  - Se adopta el estándar moderno de la W3C: `.customer-card { content-visibility: auto; contain-intrinsic-size: auto 240px; }`. El motor C++ del navegador omite de forma nativa el cálculo de layout, estilo y pintado de las tarjetas fuera del viewport. Si existen 5.000 clientes, el DOM solo procesa los 8-12 visibles en pantalla a 60 FPS estables sin dependencias JS pesadas.
- **Filtro de Jurisdicción Fiscal por País con Chips Reactivos (`Signals`):**
  - Respondiendo directamente al núcleo del reto de Roams (donde el país determina el impuesto aplicable: España 21%, Alemania 19%, Francia 20%, USA 0%), se implementa una barra de filtros de facetas: `[ 🌐 Todos (N) | 🇪🇸 ES (x) | 🇺🇸 US (y) | ... ]`.
  - Mediante señales computadas (`countryFilters = computed(...)` y `filteredCustomers = computed(...)`), los países presentes en el catálogo y sus recuentos se derivan reactivamente en memoria, permitiendo al comercial aislar clientes por jurisdicción fiscal de forma instantánea sin peticiones HTTP redundantes a la base de datos.
  - Accesibilidad semántica: implementado con `role="radiogroup"` y `role="radio"` con `aria-checked` para lectores de pantalla.

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

### 3.5 Internacionalización Reactiva y Desacoplamiento de Textos (`I18nService` + `TranslatePipe`)

Para mantener el principio de código en inglés y desacoplar la lógica de la presentación:
- **Cero Textos Hardcodeados:** Se prohíbe introducir cadenas literales de texto en clases TypeScript o plantillas HTML. Todas las etiquetas, tooltips y textos de accesibilidad (`aria-label`) se definen de forma centralizada en `src/app/core/i18n/translations.ts`.
- **Patrón Declarativo con Pipe (`TranslatePipe`):**
  En lugar de invocar métodos de servicio en las plantillas (`{{ i18n.t(...) }}`), se prescribe el uso del pipe reactivo `{{ 'clave' | translate }}`. Esto:
  1. Erradica la inyección obligatoria de `I18nService` en los componentes tontos (*Dumb Components*), manteniendo sus clases TypeScript limpias y libres de dependencias innecesarias.
  2. Sigue el estándar idiomático de Angular para i18n (familiar para evaluadores acostumbrados a *Transloco* o *ngx-translate*).
- **Tipado Estricto de Claves (`TranslationKey`):** El compilador de TypeScript valida que cualquier clave solicitada exista en el diccionario en ambos idiomas (`es` y `en`), previniendo erratas tipográficas en tiempo de compilación.
- **Detección Automática con Fallback Regional:** `I18nService` inspecciona `navigator.language` para adaptarse automáticamente a entornos internacionales, manteniendo el español (`'es'`) como idioma predeterminado de la plataforma.
- **Reactividad con Signals:** El idioma activo se almacena en una Signal `currentLanguage`, provocando el recálculo instantáneo de cualquier vista o mensaje reactivo sin necesidad de recargar la aplicación.
- **Escalabilidad de la UI y Desacoplamiento (Menú Desplegable `mat-menu` + `LanguageSelectorComponent`):**
  Para evitar que la barra de navegación colapse al incorporar nuevos idiomas ($\ge 3$ o $\ge 4$) y salvaguardar el principio *Mobile-First*, el selector de idioma se desacopla completamente del Navbar en su propio componente standalone (`src/app/shared/components/language-selector/`). Utiliza un menú flotante (`MatMenuModule`) con botón disparador de tamaño fijo (`[ 🇪🇸 ES ▾ ]`), desacoplando la cantidad de idiomas disponibles del espacio horizontal de la pantalla. Soporta de forma nativa cuádruple idioma (`Español` 🇪🇸, `English` 🇬🇧, `Deutsch` 🇩🇪, `Français` 🇫🇷) mediante la tupla centralizada `SUPPORTED_LANGUAGES`.
- **Patrón UX de Priorización del Idioma Activo (`sortedLanguages`):**
  Al abrir el menú desplegable de selección de idioma, el idioma actualmente activo se posiciona automáticamente en el primer lugar de la lista (`sortedLanguages = computed(...)`), seguido por el resto de opciones disponibles. Esto aporta confirmación visual inmediata del estado actual sin forzar al usuario a buscar o hacer scroll, mejorando la ergonomía táctil en dispositivos móviles.

#### 3.5.1 Deuda Técnica de la Edición Manual de Diccionarios y Solución Enterprise con TMS (Tolgee)

- **El Problema de la Gestión Manual de i18n (Archivos Estáticos en Git):**
  En pruebas de concepto o fases iniciales de un proyecto, mantener un objeto o archivo estático `translations.ts` o archivos JSON manuales en el repositorio Git es una solución rápida y autocontenida. Sin embargo, en un entorno empresarial de producción como el de Roams (con presencia o proyección en múltiples mercados europeos como España, Reino Unido, Alemania y Francia), este enfoque introduce **graves vicios y deuda técnica**:
  1. *El desarrollador como cuello de botella:* Cualquier corrección ortográfica, cambio comercial de copywriting o adaptación legal de términos exige crear ramas de Git, revisar Pull Requests, esperar a pipelines de CI/CD y desplegar una nueva versión de la aplicación.
  2. *Falta de contexto visual para traductores:* Los lingüistas o redactores reciben listas aisladas de claves (`customers.card.simulate.btn`) sin saber en qué pantalla aparecen, qué tamaño tienen o si el texto desbordará en pantallas móviles (*layout shift*).
  3. *Riesgo de corrupción sintáctica:* Traductores no técnicos que editan JSONs directamente suelen romper comillas, comas o caracteres escapados, provocando errores en tiempo de compilación.
  4. *Desincronización de claves entre idiomas:* A medida que el producto crece, es habitual olvidar traducir claves en alemán o francés, provocando huecos en la UI.

- **La Arquitectura Enterprise con un TMS Moderno: [Tolgee](https://tolgee.io):**
  La solución profesional consiste en desacoplar el contenido del código fuente mediante una plataforma de **Translation Management System (TMS)** como **Tolgee** (open-source, auto-hospedable o SaaS), integrándola en el ciclo de vida de desarrollo:

  ```
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                           CI / CD & LOCAL WORKFLOW                              │
  └─────────────────────────────────────────────────────────────────────────────────┘
     [Frontend Code] ───────( tolgee push )────────> [ Tolgee Platform (TMS) ]
     (HTML/TS keys)                                   │  - Traductores & Copywriters
                                                      │  - Traducción asistida por IA
                                                      │  - Capturas & In-Context Preview
                                                      ▼
     [Production Build] <───( tolgee pull )────────── [ Exportación JSON Automática ]
     (assets/i18n/*.json)
  ```

  1. **Extracción y Subida Automatizada (`@tolgee/cli push`):**
     Los ingenieros desarrollan utilizando las claves semánticas. Un script en `package.json` o un hook de Git / GitHub Actions ejecuta el CLI de Tolgee para extraer automáticamente todas las claves nuevas de las plantillas y subirlas al servidor central de traducciones sin intervención manual:
     ```bash
     npx @tolgee/cli push --force-mode OVERRIDE
     ```
  2. **Traducción en Contexto (In-Context Translation con `@tolgee/ngx`):**
     En entornos de desarrollo y staging, Tolgee permite la traducción en vivo dentro de la propia aplicación Angular:
     - El traductor o product manager pulsa `Alt + Clic` sobre cualquier texto de la UI en su navegador (`localhost:4200` o entorno de pruebas).
     - Se abre un diálogo flotante donde edita el texto en caliente, ve el resultado instantáneamente y la herramienta captura automáticamente una captura de pantalla (*screenshot*) con el elemento resaltado.
     - Los traductores externos ven exactamente dónde se ubica cada botón, tarjeta o etiqueta y su restricción espacial.
  3. **Descarga y Empaquetado en Build (`@tolgee/cli pull`):**
     Antes de compilar la versión de producción (`ng build`), el pipeline de integración continua descarga de forma desatendida los archivos JSON finales validados por el equipo lingüístico directamente a la carpeta de assets:
     ```bash
     npx @tolgee/cli pull --path ./src/assets/i18n --format JSON
     ```
  4. **Scripts de Integración en `package.json`:**
     ```json
     {
       "scripts": {
         "i18n:push": "tolgee push --path ./src",
         "i18n:pull": "tolgee pull --path ./src/assets/i18n --format JSON",
         "i18n:sync": "tolgee sync --path ./src"
       }
     }
     ```
  5. **Carga Reactiva Asíncrona (HttpClient):**
     En lugar de importar un bundle estático en el archivo `.ts`, el servicio `I18nService` consume los JSON descargados mediante un `HttpBackend` o el SDK oficial `@tolgee/ngx`, permitiendo cargar bajo demanda (*Lazy Loading*) exclusivamente el paquete del idioma seleccionado por el usuario, reduciendo el bundle inicial transferido al cliente.

### 3.6 Standalone por Defecto (Angular 19+) y Eliminación de Boilerplate Redundante

- **Standalone Default:** A partir de Angular 19 (y ratificado en Angular 22), todos los decoradores `@Component`, `@Directive` y `@Pipe` son `standalone` por defecto (`standalone: true`).
- **Cero Boilerplate:** Se prohíbe escribir la propiedad redundante `standalone: true` en los metadatos de componentes, directivas o pipes. Únicamente en el caso excepcional de requerir integración con un `NgModule` legacy se especificaría de forma explícita `standalone: false`.
- **Imports Quirúrgicos:** Los componentes declaran en `imports: [...]` exclusivamente los componentes, pipes o módulos de Angular Material que consumen sus plantillas, evitando bundles inflados.

### 3.7 Principio YAGNI y Mantenibilidad: Códigos ISO Textuales vs. Mantenimiento de Banderas Cosméticas

- **La Decisión de Producto y Arquitectura (YAGNI):**
  - Mantener diccionarios o conversores algorítmicos de banderas emoji para cientos de países cliente en un sistema B2B introduce una deuda técnica innecesaria:
    1. *Inconsistencia de Plataforma:* Las banderas emoji no se renderizan en muchos sistemas operativos de escritorio (ej. Windows muestra códigos de letras `ES` en lugar de la bandera, Linux depende de fuentes de emojis instaladas y Android usa estilos dispares).
    2. *Mantenimiento Innecesario (YAGNI):* La prueba de Roams exige validar la jurisdicción fiscal del cliente (España, UE, fuera de UE), no construir un catálogo gráfico de banderas internacionales.
    3. *Claridad y Accesibilidad:* Los códigos ISO 3166-1 alpha-2 en texto claro (`ES`, `US`, `DE`) acompañados del icono semántico accesible `<mat-icon>public</mat-icon>` son universales, no sufren problemas tipográficos y transmiten la información fiscal de un vistazo.
- **Diferenciación con el Selector de Idioma de la Aplicación:**
  - Mientras que para los datos dinámicos de clientes se prescinde de banderas cosméticas en favor de texto ISO limpio, en el selector de idiomas de la barra de navegación (`LanguageSelectorComponent`) sí se emplean los 4 emojis específicos de los idiomas soportados (`🇪🇸 ES`, `🇬🇧 EN`, `🇩🇪 DE`, `🇫🇷 FR`) como convención visual de navegación de interfaz para el usuario.

### 3.8 Estándar de Iconografía y Accesibilidad (Ligaduras de Material Symbols y `aria-hidden`)

- **Componente Oficial `<mat-icon>`:** Se prescribe el uso exclusivo de `<mat-icon>` de Angular Material frente a etiquetas `<span>` genéricas.
- **Funcionamiento por Ligaduras OpenType:** Palabras clave en inglés como `search`, `close`, `mail` o `person_search` son ligaduras tipográficas que la fuente vectorial de Google sustituye por glifos en el canvas.
- **Accesibilidad Estricta (`aria-hidden="true"`):** Todo icono decorativo o acompañado de etiqueta descriptiva debe portar `aria-hidden="true"`. Esto previene que las tecnologías de asistencia para personas con discapacidad visual pronuncien la palabra técnica del icono (ej. "search") en lugar del texto accesible traducido (`[attr.aria-label]="'customers.search.aria' | translate"`).

### 3.9 Manejo Centralizado de Errores RFC 7807 (`errorInterceptor` vs. Servicios de Dominio)

- **Principio de Responsabilidad Única (SRP / DRY):**
  La transformación, captura y normalización de errores HTTP a objetos **RFC 7807** (`ProblemDetail`) pertenece exclusivamente a la capa de infraestructura transversal: **`errorInterceptor`** (`src/app/core/errors/error.interceptor.ts`).
- **Prohibición de Textos Hardcodeados y Fugas de Depuración:**
  1. Queda terminantemente prohibido incluir literales quemados en inglés (como `'An unexpected error occurred.'`) como valor por defecto en los servicios.
  2. Queda prohibido recurrir a `httpErr.message`, ya que Angular genera internamente cadenas técnicas en inglés (`"Http failure response for ..."`), ocultando las traducciones corporativas.
  3. Los fallbacks de contingencia ante caídas de red o fallos 500 no estructurados deben derivarse obligatoriamente de las claves centralizadas de `I18nService`: `'error.communication.title'` y `'error.communication.detail'`.
- **Servicios de Negocio Limpios:**
  Servicios como `CustomerApiService` y `SimulationApiService` reciben a través del flujo de RxJS el `ProblemDetail` ya garantizado y normalizado por el interceptor, limitándose a actualizar sus señales reactivas (`error.set(problem)`) sin duplicar lógica de parseo HTTP.

### 3.10 Aislamiento de Componentes Estéticos y Tolerancia a Fallos (Fault-Tolerant UI & Graceful Degradation)

Para garantizar que fallos en elementos cosméticos o de micro-interacción (spinners, animaciones, badges) jamás bloqueen la funcionalidad base ni la carga de datos del negocio:
1. **Inmunidad del Flujo de Datos:**
   El ciclo de vida de los datos (`CustomerApiService`, `HttpClient`, RxJS) opera de forma estrictamente desacoplada de la UI. La llamada a la base de datos y la actualización de las señales (`customers()`) no están atadas a si un componente visual se renderiza o no.
2. **Garantía Anti-Bloqueo de Carga (`finalize` en RxJS):**
   Toda señal de carga (`loading`) en los servicios de API se apaga obligatoriamente en el operador `finalize()`. Esto blinda al sistema contra "spinners infinitos": tanto si la petición es exitosa (`200`), como si falla con error (`400`, `500`), o se cancela, `loading` pasa inmediatamente a `false`, liberando la UI.
3. **Desacoplamiento Estricto de Componentes Presentacionales:**
   - Componentes como `<app-loading-state>` (`src/app/shared/components/loading-state/`) o `<mat-spinner>` son puramente tontos (*Dumb Components*): reciben inputs primitivos (`message`, `diameter`) y carecen de efectos secundarios (*Zero Side Effects*).
   - El spinner del buscador (`CustomerSearchBarComponent`) es un adorno visual en el sufijo del input: el pipeline reactivo de filtrado (`Subject -> debounceTime -> emit`) corre en memoria y emitirá el término de búsqueda con independencia total del renderizado del spinner.
4. **Resiliencia de Renderizado, No Destrucción e Indicadores Contextuales:**
   Cuando existen datos en memoria (`customers().length > 0`), las transiciones de página, búsquedas secundarias o cambios de ordenación no destruyen el grid ni lo sustituyen por un spinner de bloqueo:
   - *Atenuación del grid:* El contenedor de tarjetas atenúa su opacidad (`.is-searching { opacity: 0.45; pointer-events: none; }`).
   - *Barra de Progreso Contextual (`mat-progress-bar`):* Se proyecta una barra indeterminada de Material justo encima del grid (`.grid-loading-bar`) para dar feedback explícito de carga sin provocar layout shift.
   - *Aislamiento del Spinner del Buscador:* El spinner dentro del campo de texto de búsqueda se gobierna mediante la señal computada específica `isSearchingText` (`customerApi.loading() && Boolean(searchTerm())`), impidiendo que gire erróneamente cuando el usuario navega entre páginas o cambia de país/orden.
   - *Blindaje contra Race Conditions:* Los botones de navegación de página, selectores de filtro y ordenamiento se deshabilitan defensivamente (`[disabled]="customerApi.loading()"`) mientras la petición HTTP está en tránsito, impidiendo condiciones de carrera por clics concurrentes.
5. **Degradación Elegante de Animaciones (`prefers-reduced-motion`):**
   Las animaciones de tarjetas (`roamsCardEntrance`) están implementadas en CSS nativo acelerado por GPU (sin librerías JS pesadas). Mediante `@media (prefers-reduced-motion: reduce)`, si el navegador o sistema operativo del usuario tiene desactivadas las animaciones, el estilo se desactiva instantáneamente y el contenido se presenta estático a opacidad 1 sin latencia ni artefactos.
6. **Separación Estricta de Ficheros (Cero Templates Inline):**
   Todo componente compartido debe desacoplar su lógica (`.ts`), plantilla (`.html`), estilos corporativos (`.scss`) y pruebas unitarias (`.spec.ts`) en ficheros independientes, prohibiendo templates embebidos en el decorador para facilitar su mantenimiento y evitar mezclas de responsabilidades.
7. **Cero Cadenas de Versión Hardcodeadas en la Interfaz (Dynamic Current Year):**
   Se prohíbe escribir literales estáticos como `'v1.2.0 • Online'` en plantillas de componentes (ej. el footer de `SidebarComponent`). Elementos temporales o de estado de la aplicación se calculan reactiva y dinámicamente (`readonly currentYear = new Date().getFullYear()`), evitando que la interfaz envejezca o muestre información engañosa en auditorías y revisiones de código.

### 3.11 Escalabilidad y Usabilidad en Filtros Facetados (Selector Canónico `<mat-select>` vs. Botones/Chips)

- **El Problema del Layout Shift con Chips Horizontales y Botones Manuales:**
  Disponer filtros de países como botones/chips planos contiguos es aceptable para 2 o 3 opciones. Sin embargo, en un entorno SaaS internacional con 12 o 25 jurisdicciones fiscales, los chips envuelven en múltiples líneas (*layout wrapping*), provocando saltos bruscos en la interfaz (*Cumulative Layout Shift*), empujando el grid hacia abajo y degradando severamente la experiencia de usuario en dispositivos móviles. Tampoco es estándar usar botones custom con menús si existe un control canónico de selección de formulario.
- **La Solución Enterprise:**
  Se integra un **Selector Nativo de Material (`mat-form-field` con `mat-select`)** junto al buscador:
  1. **Control de Formulario Canónico:** Utiliza `<mat-select>` con accesibilidad completa W3C ARIA, navegación por teclado (flechas, enter, escape) y etiqueta flotante integrada (`mat-label`).
  2. **Espacio Constante y Predictible:** Ocupa un ancho fijo y unificado (`subscriptSizing="dynamic"`), alineado exactamente con la barra de búsqueda sin alterar la altura de la página.
  3. **Lista Desplegable Scrollable:** El panel desplegable de opciones maneja decenas de países con scroll fluido sin alterar el DOM de la página principal.
  4. **Identificación Limpia y Textual:** Cada opción expone el código ISO en texto claro junto a la insignia de recuento numérico (`ES (1)`, `US (1)`), evitando dependencias de emojis y garantizando máxima legibilidad.

### 3.12 Redacción de Correo Comercial y Transaccional: Despacho Backend con Editor WYSIWYG Quill

- **Evolución Modular de `mailto:` a Endpoint Transaccional Backend (`POST /emails`):**
  - *Limitaciones de `mailto:` en Producción:* Un enlace `mailto:` del navegador no permite controlar formato HTML enriquecido, carece de validación, no puede reportar fallos de entrega ni transaccionales y depende del cliente de correo local del sistema operativo del usuario (que frecuentemente falla o no está configurado).
  - *Arquitectura Enterprise:* El modal de redacción (`EmailComposerDialogComponent` en `src/app/shared/components/email-composer-dialog/`) captura los datos del destinatario, asunto y cuerpo en HTML limpio y los delega a través del servicio reactivo `EmailApiService` (`src/app/core/services/email-api.service.ts`) al endpoint backend `POST /emails`.
- **Integración de Editor Enriquecido Quill (`ngx-quill` + `quill` 2.x):**
  - *Justificación Técnica para la Prueba y Entrevista:*
    1. **Frente a `contenteditable` manual:** Un `contenteditable` sin control genera HTML heterogéneo según el navegador, introduce graves problemas de accesibilidad y requiere cientos de líneas de código frágil. Quill estandariza las mutaciones DOM mediante su modelo interno *Deltas* y produce HTML semántico limpio.
    2. **Frente a CKEditor / TinyMCE:** CKEditor y TinyMCE son suites muy pesadas orientadas a colaboración o CMS, con licencias restrictivas. Para un cuerpo de correo comercial basta una barra de herramientas ligera y enfocada.
    3. **Frente a TipTap:** TipTap es *headless* y exige construir toda la barra de herramientas y controles visuales desde cero. `ngx-quill` provee soporte oficial para Angular 22, configuración declarativa (`quillModules`) y empaquetado *Lazy Loaded* (chunk segregado de solo ~51 kB de transferencia), blindando el rendimiento del bundle inicial.
  - *Barra de Herramientas Estándar y CSS Defensivo:* Negrita, cursiva, subrayado, tachado, listas ordenadas y con viñetas, jerarquía de encabezados (`h1`, `h2`, `h3`) y botón de limpieza de formato (`clean`). Se importan los estilos base en `src/styles.scss` (`@import 'quill/dist/quill.snow.css';`) y se refuerzan reglas de contención en el componente (`::ng-deep`) para acotar los botones a `28x28px` y los iconos SVG a `16px`, previniendo distorsiones visuales por falta de CSS.
- **Seguridad Defensiva, Sanitización HTML Anti-XSS y Cero Fuga de Secretos:**
  - Siguiendo los principios de **OWASP Top 10 (A03: Injection)**, el backend nunca confía en el HTML emitido por el cliente. El servicio de dominio `HtmlSanitizerService` (`src/modules/emails/domain/services/html-sanitizer.service.ts`) sanea el contenido antes de procesarlo o remitirlo a un gateway SMTP, eliminando etiquetas ejecutables (`<script>`, `<iframe>`, `<object>`, `<embed>`), manejadores de eventos inline (`onclick`, `onload`, `onerror`) y esquemas de URI peligrosos (`javascript:`).
  - *Despacho Transaccional Simulado vs. Dependencia de Nodemailer Real (Decisión Estratégica para Pruebas Técnicas):*
    1. **Developer Experience (DX) para el Evaluador:** Exigir un servidor SMTP real obligaría al evaluador técnico a configurar cuentas de correo externas o provocaría errores 500 de conexión al probar el botón. La prueba debe ejecutarse de forma 100% determinista y sin fricción (*Out-of-the-Box*).
    2. **Cero Exposición de Secretos (OWASP / Git Hygiene):** Queda terminantemente prohibido incluir contraseñas de aplicación de Google o tokens SMTP en repositorios públicos de GitHub.
    3. **Aislamiento Hexagonal (Puertos y Adaptadores):** El caso de uso `SendEmailUseCase` se apoya en un puerto de salida secundario agnóstico (`EmailSenderPort`). En producción, la infraestructura sustituye el stub en memoria por un adaptador con `Nodemailer` o el SDK de `Resend`/`SendGrid` consumiendo credenciales de un archivo `.env` seguro, sin tocar una sola línea de lógica de dominio ni de frontend.
- **Experiencia de Usuario Reactiva y Resiliente (UI/UX Feedback):**
  1. **Edición Libre con Validación Reactiva en Caliente (RFC 5322):** El campo de correo implementa un `FormControl` reactivo con `ShowOnDirtyErrorStateMatcher` de Angular Material. Evalúa el formato en tiempo real mientras el usuario escribe (`control.dirty`), contrastando contra la expresión regular RFC 5322 (local-part, `@`, dominio y TLD de al menos 2 caracteres). Proyecta un `<mat-error>` traducido multidioma y desactiva el botón de envío si el valor es inválido o está vacío, eliminando errores antes de emitir la petición HTTP.
  2. **Indicador de Carga Transaccional:** El botón de confirmación muestra un spinner (`<mat-spinner diameter="18">`) y bloquea pulsaciones duplicadas mientras la petición HTTP está en tránsito.
  3. **Tratamiento de Errores RFC 7807:** Si el backend rechaza la petición (ej. error de validación o caída de pasarela), el diálogo despliega un banner de alerta inline (`.error-banner`) con el detalle del problema sin cerrar la ventana para evitar la pérdida del texto redactado.
  4. **Confirmación y Cierre Automático:** Al confirmarse el despacho (`201 Created`), el botón conmuta a estado exitoso con icono de verificación y el diálogo se cierra tras 800 ms, emitiendo una notificación toast accesible (`MatSnackBar`) en la vista emisora (`CustomerCardComponent` o `CustomerDetailComponent`) identificando explícitamente el email destinatario remitido.
  5. **Mecanismo de Respaldo ("Copiar plantilla"):** Se mantiene la utilidad para copiar el texto plano al portapapeles (`navigator.clipboard`) con confirmación temporal de 2.5 segundos.

### 3.13 Regla de Oro: "Code in English, documentation in Spanish"

- **Prohibición Estricta de Castellano en Código Fuente:**
  Todas las declaraciones de variables, nombres de métodos, interfaces, tipos, selectores de componentes, estilos CSS y comentarios JSDoc (`/** ... */`) dentro de los ficheros de código (`.ts`, `.html`, `.scss`, `.js`) deben redactarse exclusivamente en **inglés**.
- **Documentación en Español:**
  La documentación de arquitectura (`architecture-guidelines.md`), especificaciones funcionales (`functional-specs.md`), bitácoras de auditoría (`prompts-and-audits.md`) y el `README.md` principal se redactan en **español**, tal como exige el pliego técnico de Roams.

### 3.14 Desacoplamiento del Protocolo HTTP en la UI y UX Defensiva (OWASP & Clean Presentation)

- **Principio de Aislamiento de Capas y Mínima Revelación:**
  Bajo las directrices de Clean Architecture, seguridad OWASP y los estándares de UX en B2B SaaS, **los códigos de transporte HTTP (`400`, `404`, `500`) pertenecen al protocolo de red, nunca a la interfaz de usuario**:
  1. *Fuga de Abstracción:* Mostrar badges con `400` o `500` en la interfaz es un antipatrón que confunde a comerciales y directivos, asemejando la aplicación a una consola de depuración en lugar de un producto SaaS terminado.
  2. *Antipatrón de Números Mágicos en Componentes:* Condicionar el renderizado de la UI con chequeos como `p.status === 0 || p.status >= 500` introduce lógica de transporte en componentes puramente presentacionales.
- **La Solución Enterprise Implementada:**
  1. **Enmascaramiento en Interceptor (`errorInterceptor`):** Si una respuesta HTTP devuelve un código `>= 500` o `0` (caída de conectividad), el interceptor enmascara automáticamente cualquier traza interna transformándola en un `ProblemDetail` con título y detalle amigables y localizados (`error.communication.title`: *"Servicio temporalmente no disponible"*, `error.communication.detail`: *"No hemos podido conectar con el servidor..."*).
  2. **Erradicación Total de Badges de Estado HTTP en la UI (`ErrorBannerComponent`):** El componente presentacional no renderiza ningún número de código HTTP. Se centra exclusivamente en lo que el usuario necesita:
     - Título descriptivo (`p.title`)
     - Detalle legible (`p.detail`)
     - Tabla estructurada de parámetros no válidos (`p.invalidParams`) para validaciones de formulario.
  3. **Componente Presentacional Puro:** Sin números mágicos ni heurísticas de protocolo. El modelo `ProblemDetail` mantiene `status?: number` de forma opcional por compatibilidad con el estándar RFC 9457 y trazabilidad de logs, pero la capa visual queda 100% desacoplada.
  4. **Acción Reconciliadora Inmediata (`[retryable]="true"` y `(retry)`):** Proporciona un botón explícito de reintento (`Reintentar` / `Retry`) con icono de refresco que permite al usuario volver a solicitar los datos (`loadCustomers()`) sin necesidad de recargar toda la página del navegador.

### 3.15 Arquitectura de Paginación Server-Side y Optimización de Renderizado en Scroll

#### A. Aislamiento de Transporte Hexagonal en Backend
1. **Responsabilidad de Transporte en el Adaptador Primario:**
   El controlador REST (`CustomerController`) es el único responsable de parsear los query parameters `page` y `limit` de tipo `string` a números enteros (`parseInt(page, 10)`), validar sus rangos y construir las cabeceras HTTP de respuesta estándar RFC:
   ```typescript
   res.setHeader('X-Total-Count', total.toString());
   if (pageNum) res.setHeader('X-Page', pageNum.toString());
   if (limitNum) {
     res.setHeader('X-Limit', limitNum.toString());
     res.setHeader('X-Total-Pages', Math.max(1, Math.ceil(total / limitNum)).toString());
   }
   ```
2. **Dominio y Casos de Uso Desacoplados:**
   El caso de uso `ListCustomersUseCase` y el puerto de repositorio `CustomerRepositoryPort` manejan `page?: number` y `limit?: number` puramente como parámetros numéricos de dominio, devolviendo `PaginatedResult<Customer>` (`{ items: Customer[]; total: number }`), completamente agnósticos del framework NestJS o de la interfaz `Response` de Express.
3. **Persistencia SQL Eficiente (`findAndCount`):**
   El adaptador de persistencia `CustomerPersistenceAdapter` delega la paginación a la base de datos SQLite ejecutando `skip: (page - 1) * limit` y `take: limit`, garantizando que únicamente los registros solicitados sean transferidos desde disco a memoria.
4. **Retrocompatibilidad del Contrato REST (Cero Breaking Changes):**
   El cuerpo de la respuesta HTTP (`response.body`) continúa devolviendo un array plano `CustomerResponseDto[]`. Esto asegura que los clientes existentes, pruebas E2E y suites de Postman (`pm.expect(pm.response.json()).to.be.an('array')`) sigan funcionando de forma transparente mientras exponen los metadatos de recuento total a clientes avanzados a través de cabeceras CORS autorizadas (`exposedHeaders: ['X-Total-Count', ...]`).

#### B. Paginación Server-Side y Optimización de DOM en Frontend
1. **Consumo Reactivo en `CustomerApiService`:**
   El servicio de Angular consume la API configurando `observe: 'response'` en `HttpClient` para extraer de forma combinada el payload tipado `res.body` y el valor numérico de la cabecera `x-total-count`, emitiendo `CustomerListResponse { items: Customer[]; total: number }`.
2. **Paginador Canónico de Angular Material:**
   `CustomerListComponent` implementa controles de paginación basados en Material con botones de salto rápido (`first_page`, `last_page`), desplazamiento paso a paso (`chevron_left`, `chevron_right`), ventana deslizante de páginas visibles ($\pm 2$) y selector dinámico de tamaño de página (6, 12, 24).
3. **Renderizado Mínimo y Control de Memoria:**
   Bajo paginación puramente server-side, únicamente se mantienen en el DOM los elementos correspondientes a la página activa (máximo 12 tarjetas por defecto). Esto evita la acumulación de cientos de nodos en memoria cuando la base de datos crece.
4. **Aceleración por GPU y CSS Containment (`content-visibility: auto`):**
   Cada tarjeta (`.customer-card`) declara la directiva W3C CSS Containment:
   ```scss
   .customer-card {
     content-visibility: auto;
     contain-intrinsic-size: auto 240px;
   }
   ```
   Esta propiedad instruye al motor C++ del navegador (Chromium/Gecko/WebKit) para omitir por completo las operaciones de cálculo de diseño (*layout*), pintado (*paint*) y renderizado de aquellas tarjetas que se encuentran fuera del área visible (*viewport*), activándolas de forma asíncrona solo a medida que el usuario hace scroll hacia ellas. La reserva de altura `contain-intrinsic-size: auto 240px` previene saltos bruscos en la barra de scroll (*layout shift*).
5. **Detección de Cambios Optimizada (`ChangeDetectionStrategy.OnPush` y `@for track`):**
   Tanto `CustomerListComponent` como `CustomerCardComponent` emplean `ChangeDetectionStrategy.OnPush`. Angular evalúa las tarjetas únicamente cuando cambian sus referencias de señal o se disparan eventos directos. La directiva nativa `@for (customer of paginatedCustomers(); track customer.id)` recicla quirúrgicamente los nodos del DOM por su clave única primaria inmutable `customer.id`.
6. **Comparativa Técnica: CSS Containment vs. CDK Virtual Scroll:**
   Para un grid multi-columna fluido responsive (`grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`), el uso de `cdk-virtual-scroll-viewport` es desaconsejable, ya que impone dimensiones de fila fijas en un único eje y fuerza un scroll contenedor artificial (*scroll-jacking*). La combinación de **Paginación Server-Side (12 elementos/página) + CSS `content-visibility: auto` + `ChangeDetectionStrategy.OnPush`** ofrece el máximo rendimiento posible con código nativo, limpio y 100% responsive.

### 3.16 Ordenación Multi-Criterio Server-Side y Catálogo Maestro Inmutable de Jurisdicciones (SSOT)

#### A. Necesidad Ineludible de Ordenación en la API
1. **La Trampa del Sort en Cliente:**
   En cualquier sistema con paginación server-side, ordenar en el navegador mediante `array.sort()` es un antipatrón grave: únicamente reorganiza los 12 elementos recibidos de la página activa, dejando fuera del ordenamiento al resto de registros de la base de datos.
2. **Implementación en Base de Datos SQL (TypeORM):**
   La API admite los parámetros de consulta `sortBy` (`companyName`, `createdAt`, `country`, `taxId`) y `order` (`ASC`, `DESC`). El adaptador de persistencia `CustomerPersistenceAdapter` traslada esta directiva a la cláusula `ORDER BY` de la consulta SQL:
   ```typescript
   const options: FindManyOptions<CustomerTypeOrmEntity> = {
     order: { [activeSortField]: activeOrder },
     skip: (page - 1) * limit,
     take: limit,
   };
   ```
   Esto asegura que la ordenación se aplique sobre el universo total de clientes antes de particionar por página (`LIMIT` y `OFFSET`).

#### B. Erradicación del Antipatrón de Países Dinámicos (SSOT)
1. **El Problema del Descubrimiento desde la Página Activa:**
   Extraer países inspeccionando `response.items` de la llamada HTTP en cada carga (`new Set([...availableCountries(), ...response.items.map(c => c.country)])`) es una mala práctica: si un cliente de una jurisdicción específica reside en la página 4, el selector de filtros jamás la mostrará hasta que el usuario navegue a dicha página.
2. **Catálogo Maestro Centralizado e Inmutable (`SUPPORTED_FISCAL_COUNTRIES`):**
   Tanto en el frontend como en el backend se define una constante canónica inmutable (`SUPPORTED_FISCAL_COUNTRIES: readonly string[] = ['CH', 'DE', 'ES', 'FR', 'GB', 'IT', 'SE', 'US'] as const`). El selector `<mat-select>` se alimenta de forma pura y reactiva de esta constante única, eliminando mutaciones en caliente, estados inconsistentes y algoritmos innecesarios de ordenación ad-hoc en los componentes.

### 3.17 Arquitectura de Routing Modular por Módulos y Estudio de Simulación Interactiva

Para responder a las necesidades de extensión futura del equipo comercial y separar con nitidez las responsabilidades de navegación:

1. **Routing Modularizado con Lazy Loading (`loadChildren`):**
   - En lugar de concentrar todas las rutas en `app.routes.ts`, cada módulo encapsula su propio árbol de rutas:
     - `customers.routes.ts`: `''` (listado y buscador de clientes) y `':id'` (detalle del cliente con simulador interactivo e historial).
     - `simulations.routes.ts`: `''` (hub comercial de simulaciones y selector rápido de cuenta).
     - `app.routes.ts`: Configura `loadChildren` para cada dominio funcional y delega la ruta raíz a `HomeComponent` (`/home`).
2. **Sidebar de Navegación Lateral (`SidebarComponent`):**
   - Menú lateral persistente en el layout de la aplicación con navegación accesible a los módulos: Inicio (`/home`), Clientes (`/customers`) y Simulaciones (`/simulations`).
   - Soporte para colapso a iconos con `signal<boolean>` y adaptación responsive automática en móviles.
3. **Estudio de Simulación con Slider a 60 FPS (`CustomerDetailComponent`):**
   - El formulario utiliza un control deslizante `<mat-slider>` sincronizado con inputs numéricos para manipular usuarios activos (1–150), almacenamiento (GB) y llamadas API.
   - Toda la proyección de costes y desglose por tramos se ejecuta mediante señales computadas reactivas (`computed()`) apoyadas en `LocalPricingCalculator`, garantizando 60 FPS sin latencia de red.
   - El botón «Guardar Simulación» persiste la simulación en SQLite llamando a `POST /simulations` y actualiza reactivamente el historial cronológico de presupuestos del cliente.
4. **Patrón de Selector Accesible y Permanencia de Botones de Acción (Zero Layout Shift):**
   - En selectores y lanzadores de acción (ej. `SimulationHubComponent`), se prohíbe la duplicación de etiquetas externas y placeholders estáticos en `<mat-select>`. Se consolidan en un único `<mat-label>` flotante nativo de Angular Material con opción nula explícita (`-- Seleccionar cliente corporativo --`).
   - Los botones de acción principal nunca deben destruirse o eliminarse condicionalmente del DOM mediante directivas estructurales (`@if`) durante estados de carga o selecciones vacías: permanecen siempre renderizados en el layout con enlace reactivo `[disabled]` y estilos CSS accesibles (`cursor: not-allowed; opacity: 0.75`), blindando la interfaz contra saltos de diseño (*layout shift*).

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
5. **Testing en Entornos Zoneless con Vitest:**
   - En Angular 22 zoneless, se descartan los helpers legacy dependientes de `zone.js` (`fakeAsync`, `tick`). Se adoptan los timers nativos de Vitest (`vi.useFakeTimers()`, `vi.advanceTimersByTime()`, `vi.useRealTimers()`).
   - El ciclo de vida de los Smart Components exige ejecutar `fixture.detectChanges()` para disparar `ngOnInit()` antes de esperar peticiones en `HttpTestingController`.
6. **Invariantes de Test Dinámicos contra la Configuración SSOT (Open-Closed Principle):**
   - Los tests unitarios nunca deben depender de arrays literales quemados (ej. `['es', 'en', 'de', 'fr']`) ni de comprobaciones de longitud estáticas (`length === 4`).
   - En su lugar, validan de forma invariante contra la configuración autoritativa del proyecto (`SUPPORTED_LANGUAGES`). Si en el futuro se añade un nuevo idioma al catálogo de configuración (vía Tolgee o TS), la suite de pruebas sigue pasando al 100% de forma determinista sin exigir modificar ningún archivo de test.

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
| `npm run lint` | **Análisis Estático (Oxlint)** | Linter Rust ultrarrápido (`oxlint --type-aware src/`). Muestra diagnósticos de advertencias y errores con ruta de fichero, número de línea y fragmento visual de código. | ~250 ms |

---

### 4.3 Herramientas de Análisis Estático y Linter Unificado (`oxlint`)

Para garantizar la máxima higiene y consistencia sintáctica y tipológica en todo el monorepo sin penalizar el flujo de trabajo con la lentitud de ESLint tradicional:
1. **Unificación de Tooling de Linting en Monorepo:**
   - Tanto el backend (`mic-saas-omatic`) como el frontend (`spa-saas-omatic`) utilizan **Oxlint** (`oxlint` + `oxlint-tsgolint`), un linter de última generación programado en Rust compatible con TypeScript y Type-Aware diagnostics.
   - En el frontend, se ejecuta mediante el script de npm:
     ```bash
     npm run lint
     # Ejecuta: oxlint --type-aware src/
     ```
2. **Diagnósticos en Consola Precisos y Contextuales:**
   - Cuando se detecta cualquier discrepancia (variables sin uso, uniones de tipos redundantes, archivos vacíos, promesas flotantes), Oxlint imprime en la terminal:
     - Nombre de la regla y severidad (`eslint(no-unused-vars)`, `typescript(no-redundant-type-constituents)`, etc.).
     - Ruta absoluta y relativa exacta del archivo afectado.
     - Coordenadas de línea y columna (`archivo.ts:16:7`).
     - Bloque contextual de código coloreado con marcadores visuales (`^^^|^^^`) indicando el token problemático.
     - Mensaje de ayuda accionable (`help: Did you mean to use this variable?`).
3. **Configuración Declarativa (`.oxlintrc.json`):**
   - El frontend cuenta con su archivo de configuración `.oxlintrc.json`:
     ```json
     {
       "$schema": "./node_modules/oxlint/configuration_schema.json",
       "rules": {
         "typescript/no-explicit-any": "off",
         "typescript/no-floating-promises": "error"
       },
       "env": {
         "browser": true
       }
     }
     ```
4. **Política de Cero Advertencias y Cero Errores:**
   - La suite completa del frontend pasa con `0 warnings and 0 errors` tras la purga de código huérfano y variables no utilizadas en specs.

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
