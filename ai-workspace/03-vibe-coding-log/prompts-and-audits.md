# Bitácora de Desarrollo con IA y Control de Calidad (Vibe Coding Log)
**Proyecto:** SaaS-O-Matic (Dynamic Billing & Subscription Optimizer)  
**Metodología:** Spec-Driven Development + Vibe Coding Auditado  
**Enfoque de Evaluación:** Criterio Técnico y Rol de Director de Orquesta (25% Roams)  

---

## 🎯 Marco Metodológico: Las Dos Dimensiones del Rol de Director de Orquesta

Esta bitácora documenta de forma transparente la colaboración entre el desarrollador y los modelos de IA generativa. En lugar de un uso pasivo de "copiar y pegar prompts", el proceso se estructura en **dos dimensiones complementarias** que demuestran criterio senior:

### 1. Dimensión Proactiva: Inputs Estratégicos y Dirección de Arquitectura
El desarrollador establece los cimientos técnicos, directrices de diseño y reglas de negocio antes de la generación:
- **Estrategia lingüística profesional:** Fijación de la regla "Código en inglés, documentación en español" para evitar código genérico y orientarlo al evaluador local.
- **Rigor fiscal oficial:** Imposición de algoritmos reales de la AEAT (DNI/NIE/CIF con letras K, L, M y control mixto según RD 1065/2007) y sanitización previa de entradas.
- **Simetría arquitectónica 1:1:** Diseño de carpetas modular simétrico entre backend NestJS y frontend Angular (`modules/customers/` y `modules/simulations/`).
- **Developer Experience (DX) orientada a la evaluación:** Exigencia de comandos de test deterministas de una sola pasada (`--watch=false`) y plantillas de configuración (`.env.example`).
- **Sistema de diseño corporativo:** Adopción de la identidad visual de `roams.es` con Design Tokens en `:root` propagados por cascada CSS nativa.
- **Encapsulación Domain-Driven:** Aislamiento estricto de componentes, templates y SCSS dentro de cada módulo frente a componentes globales transversales de shell.

### 2. Dimensión Reactiva: Auditoría Crítica, Code Review y Quality Gates
El desarrollador actúa como filtro de calidad inflexible, detectando y erradicando los sesgos de inercia y *code smells* de la IA:
- **Clean Code & Tipado:** Sustitución de bloques procedimentales `switch` por mapas declarativos $O(1)$ y fuentes únicas de verdad (`CURRENCY_METADATA`).
- **Internacionalización Real (i18n):** Erradicación de formatos locales hardcodeados (`es-ES`) en favor del estándar W3C `Intl.NumberFormat`, y creación de `I18nService` reactivo con Signals para eliminar textos fijos en TypeScript.
- **Higiene de código y APIs modernas:** Eliminación de advertencias de deprecación (`provideNoopAnimations`), supresión de ruido en consola (`stderr`) con espías `vi.spyOn`, y adopción estricta del *Built-in Control Flow* (`@for`, `@if`).

---

## Sección 1: Definición de Especificaciones y Contratos (`01-specs/`)

### 1.1. Idioma: Código en inglés, Documentación en español
- **Situación inicial:** La IA comenzó a redactar `functional-specs.md` en inglés.
- **Tu corrección:** Me paraste los pies: *"Código en inglés, documentación en español. Porque el enunciado es en español, Andrea es española y el evaluador va a leer tu planificación en español. Si lo pones todo en inglés parece un prompt copiado de internet"*.
- **Solución aplicada:** Toda la documentación, bitácoras y especificaciones se pasaron a español riguroso, manteniendo en inglés únicamente el código, las entidades y los contratos técnicos (`Customer`, `Simulation`, `taxId`).

### 1.2. Tipos de CIF incompletos (Faltaban K, L, M)
- **Situación inicial:** La IA definió la expresión regular de tipos de CIF como `[ABCDEFGHJNPQRSUVW]`, omitiendo las letras `K`, `L` y `M`.
- **Tu corrección:** Me contradijiste señalando que `K` (menores sin DNI), `L` (no residentes) y `M` (extranjeros sin NIE) son CIFs válidos de la AEAT según el Real Decreto 1065/2007, y que `L, M` admiten control mixto (letra o dígito).
- **Solución aplicada:** Se actualizó `functional-specs.md` y `openapi.yaml` a `[ABCDEFGHJKLMNPQRSUVW]` (todas menos `I, Ñ, O, T, X, Y, Z`) e incluimos `L` y `M` en la regla de control mixto.

### 1.3. Normalización vs. Rechazo de `taxId`
- **Situación inicial:** La IA especificó que si el `taxId` venía con minúsculas o guiones debía ser rechazado con un error 400.
- **Tu corrección:** Me advertiste: *"Si el evaluador te manda `b-12345674` o `B 12345674` y lo rechazas, suspendes. Mejor normalización previa con trim + mayúsculas + quitar espacios y guiones antes de validar"*.
- **Solución aplicada:** Se definió en las specs y se implementó `normalizeTaxId()` en `tax-id.vo.ts`, permitiendo que el sistema sea tolerante a fallos de entrada y sanitice antes de validar y persistir.

### 1.4. Fidelidad a la Fuente de Verdad: No buscar por email
- **Situación inicial:** Surgió la duda de si el buscador del Dashboard debía filtrar también por `email`.
- **Auditoría contra el Word:** Cotejamos el documento oficial del reto de Roams, donde se especifica literalmente: *"Un buscador por nombre de empresa o identificador fiscal"*.
- **Solución aplicada:** Decidimos respetar estrictamente el Word para evitar introducir requisitos inventados o campos no solicitados.

### 1.5. Alineación de Errores RFC 7807: Ejemplos en Inglés y Formato URI de `type`
- **Situación inicial:** En `functional-specs.md` y `openapi.yaml`, el JSON de ejemplo para el estándar RFC 7807 contenía mensajes en español (`"detail": "El identificador fiscal..."`) y una URI ficticia (`"type": ".../validation-error"`).
- **Tu corrección:** Me señalaste la incoherencia: *"Código y payloads de la API en inglés, documentación en español. La API real devuelve `detail` en inglés. Además, en tu filtro pones `type: .../${status}` (ej. `.../400`). Alinea el contrato en ambos ficheros para no tener contradicciones en la defensa"*.
- **Solución aplicada:** Se actualizaron `functional-specs.md` y `openapi.yaml` con `"type": "https://errors.saas-o-matic.com/400"`, `"detail": "Invalid tax identifier 'B1234567X' for country 'ES'."` y razones en inglés para `invalidParams`, logrando una coherencia del 100% entre especificación, contrato y filtro de excepciones.

---

## Sección 2: Directrices de Arquitectura y Scaffolding (`02-architecture/`)

### 2.1. Descarte de Overengineering (No a Keycloak / Auth0)
- **Situación inicial:** Se evaluó si añadir autenticación externa o tokens JWT.
- **Consenso de diseño:** Se descartó conscientemente; el enunciado oficial pide una herramienta comercial interna de simulación de costes, no un servidor de identidades OAuth2. Añadirlo habría sido sobre-ingeniería innecesaria que desenfoca la prueba técnica.
- **Solución aplicada:** Arquitectura de API interna directa y limpia en v1, documentada en `architecture-guidelines.md`.

### 2.2. Ubicación de `customers.module.ts` y de la carpeta `shared/`
- **Situación inicial:** En el primer borrador de carpetas, `customers.module.ts` aparecía dentro de `infrastructure/` y `shared/` dentro de `modules/shared/`.
- **Criterio de arquitectura:** Se acordó que `customers.module.ts` debía residir en la raíz de su módulo para orquestar explícitamente las tres capas (`domain`, `application`, `infrastructure`), y que `shared/` debía situarse en `src/shared/` para dejar patente su rol transversal a toda la aplicación.
- **Solución aplicada:** Se plasmó la estructura canónica en `architecture-guidelines.md` con la nomenclatura explícita de puertos (`ports/in/`, `ports/out/`) y adaptadores (`adapters/in/rest/`, `adapters/out/persistence/`).

### 2.3. Scaffolding Atómico en Git
- **Situación inicial:** Se planteó commitear el scaffolding inicial del backend y del frontend juntos en un único commit.
- **Decisión de control:** Se decidió separar el scaffolding de la API del frontend para mantener el historial de Git 100% limpio y trazable.
- **Solución aplicada:** Dos commits independientes: `chore(api): scaffold nestjs backend application` y `chore(dashboard): scaffold angular 21 frontend application`.

### 2.4. Metodología de Desarrollo: Fichero a Fichero con TDD
- **Situación inicial:** La IA intentó generar varios ficheros de infraestructura juntos.
- **Tu corrección:** Me frenaste en seco: *"Para, vamos fichero a fichero para no perder el control"*.
- **Solución aplicada:** Establecimos la regla estricta de generar una sola pieza por turno, acompañada de su test unitario en Jest, verificada por ti en terminal antes de pasar a la siguiente.

---

## Sección 3: Módulo de Clientes (`Customers`) e Infraestructura

### 3.1. Fallo Matemático Crítico en el Test de NIE (`Y1234567B` vs `Y1234567X`)
- **El error de la IA:** En `spanish-fiscal.validator.spec.ts`, la IA generó un test con `11234567 % 23 = 11 -> 'B'`, asumiendo que `Y1234567B` era válido.
- **Tu corrección:** Me cazaste el error de cálculo mental: *"El cálculo está mal: 11234567 % 23 no da 11, da 10, y 10 es X, no B. Si lo lanzas da rojo"*.
- **Solución aplicada:** Se rehizo la división ($11234567 \pmod{23} = 10$). La posición 10 en la tabla `TRWAGMYFPDXBNJZSQVHLCKE` es la letra **`X`**. Se corrigió el test a `Y1234567X` y pasó en verde.

### 3.2. Cadena de Prototipos Rota en Excepciones (`Object.setPrototypeOf`)
- **El error de la IA:** En la clase base `DomainError` la IA escribió: `Object.setPrototypeOf(this, DomainError.prototype);`.
- **Tu corrección:** Me advertiste: *"Eso te rompe el `instanceof` de las hijas. `new EntityNotFoundException() instanceof EntityNotFoundException` dará false porque le fuerzas el prototipo a la base. Usa `new.target.prototype`"*.
- **Solución aplicada:** Se cambió a `Object.setPrototypeOf(this, new.target.prototype);`, asegurando que `instanceof EntityNotFoundError` y `instanceof ConflictError` funcionen de forma impecable en el filtro de excepciones.

### 3.3. Colisión de Nombres con `@nestjs/common`
- **El error de la IA:** Las excepciones de dominio se nombraron inicialmente como `ConflictException` y `EntityNotFoundException`.
- **Tu corrección:** Advertiste que NestJS ya tiene `ConflictException` y `NotFoundException` en `@nestjs/common`, lo que generaría confusión en los imports y en el filtro global.
- **Solución aplicada:** Se renombraron a `ConflictError` y `EntityNotFoundError`, dejando claro que pertenecen al dominio y no a la capa HTTP.

### 3.4. Eliminación de Comentarios Obvios (Código Limpio)
- **El error de la IA:** La IA incluyó comentarios redundantes tipo `// Encapsulation`, `// Getters`, `// Pure Domain Entity`.
- **Tu corrección:** Me pediste expresamente eliminarlos: el código debe ser autoexplicativo y no cantar a plantilla de IA.
- **Solución aplicada:** Se limpiaron las entidades y Value Objects de comentarios obvios, dejando un código limpio y conciso.

### 3.5. Búsqueda Normalizada en el Repositorio (`b - 1234`)
- **El error de la IA:** En `CustomerPersistenceAdapter.search(term)` se buscaba directamente con `Like(%term%)` sobre el campo `taxId`.
- **Tu corrección:** Señalaste que al guardar el CIF normalizado (`B12345674`), si un comercial busca `b-1234` el `Like` fallaría.
- **Solución aplicada:** Se añadió `normalizedTaxTerm = %${normalizeTaxId(term)}%` para la búsqueda en `taxId`, permitiendo encontrar el cliente sin importar cómo lo teclee el usuario.

### 3.6. Diseño de Integración: Historial de Simulaciones en el Detalle del Cliente
- **Duda planteada:** Se analizó si `GET /customers/:id` debía devolver únicamente los datos planos del cliente o también sus simulaciones históricas.
- **Auditoría contra OpenAPI:** Se confirmó en el contrato `openapi.yaml` que la respuesta final esperada corresponde al esquema `CustomerWithSimulations` (cliente + array de simulaciones).
- **Estado y acuerdo:** Queda documentado y planificado para conectarse cuando se implemente el módulo `Simulations`, asegurando que `GET /customers/:id` devuelva el historial de simulaciones ordenadas cronológicamente.

### 3.7. Seguridad en Errores 500 y `title` en RFC 7807
- **El error de la IA:** En errores no controlados (500), el filtro exponía `detail = exception.message` al cliente, y cuando `HttpException` era un string no actualizaba el campo `title`.
- **Tu corrección:** Me corregiste: *"No filtres el mensaje del 500, expone errores internos de SQLite al cliente. Pon 'An unexpected error occurred' y console.error. Y si HttpException es string, pon `title = exception.name`"*.
- **Solución aplicada:** Se blindó el filtro para no fugar información interna en errores 500 hacia el cliente HTTP, registrando en los logs del servidor con `console.error`, y se corrigió el mapeo de `title`.

### 3.8. Inmutabilidad de Fechas en Persistencia: Descarte de `@CreateDateColumn` en `CustomerTypeOrmEntity`
- **El error de la IA:** La entidad TypeORM de clientes se definió inicialmente con `@CreateDateColumn({ type: 'datetime' })`.
- **Tu corrección:** Me señalaste: *"En DDD el dominio gobierna sus invariantes y genera su propio `createdAt = new Date()`. `@CreateDateColumn` hace que TypeORM intercepte el `INSERT` y ponga su propio `NOW()`, generando dos fechas distintas entre memoria y base de datos con unos milisegundos de discrepancia. Usa `@Column('datetime')` para respetar fielmente el valor del dominio y limpia el import no utilizado"*.
- **Solución aplicada:** Se sustituyó por `@Column('datetime')` tanto en `CustomerTypeOrmEntity` como en `SimulationTypeOrmEntity`, unificando el principio de inmutabilidad de fechas entre capas en todo el backend.

---

## Sección 4: Módulo de Simulaciones (`Simulations`) y Estabilización de Tests ESM

Una vez consolidada la bitácora de auditoría en la carpeta del proyecto, se dio paso a la construcción del módulo de simulaciones mediante el desarrollo de la lógica del motor de cálculo (`pricing-engine.service.ts`) y del servicio fiscal (`tax-calculator.service.ts`), garantizando el desacoplamiento respecto a frameworks y la consistencia en el entorno de pruebas.

### 4.1. Algoritmo del Motor de Precios: Iterativo vs Cascada `if/else`
- **Situación inicial:** La IA propuso una cadena rígida de sentencias `if / else if` para calcular el coste acumulado por tramos (0-10, 11-50, >50 usuarios).
- **Tu intervención y refactor:** Reescribiste el servicio con una solución algorítmica iterativa mucho más limpia y escalable: una estructura de datos `PRICING_TIERS` (`upTo`, `price`) recorrida mediante un bucle `for...of` que calcula dinámicamente los usuarios absorbidos en cada tramo y acumula el coste en $O(N)$. Además, depuraste variables residuales no utilizadas (`let totalCost = 0;`).
- **Solución aplicada:** Algoritmo conciso, mantenible y parametrizable sin tocar la lógica matemática del bucle.

### 4.2. Estandarización de Constantes y Semántica Fiscal (`fiscal.constants.ts`)
- **Situación inicial:** La IA generó un fichero denominado `country.constants.ts` conteniendo `TAX_RATES` y `EU_COUNTRIES`, manteniendo los tramos de precio hardcodeados localmente en el servicio.
- **Tu corrección:** Me frenaste con dos objeciones clave de diseño:
  1. *"El nombre del fichero no me gusta mucho country.constants pues hay country y tax... mejor unificarlo"*.
  2. *"¿Esto no iría a una constante por si cambia y se usa en varias partes del proyecto? const PRICING_TIERS = ..."*.
- **Solución aplicada:** Se renombró a `fiscal.constants.ts` dentro de `shared/domain/constants/` y se centralizaron allí `PRICING_TIERS`, `TAX_RATES` y `EU_COUNTRIES` protegidos con `Readonly`. Esto establece una **fuente única de verdad** compartida entre el backend y la calculadora interactiva en memoria del frontend Angular (slider de usuarios).

### 4.3. Servicio de Cálculo de Impuestos y Blindaje de Invariantes
- **Diseño implementado:** En `tax-calculator.service.ts` se implementaron funciones puras de dominio (`getTaxRate`, `calculateTaxBreakdown`) cumpliendo la normativa fiscal de las especificaciones:
  - Tipos impositivos por país: España (21%), Alemania (19%), Francia (20%), Italia (22%), Reino Unido (20%), EE.UU. (0%).
  - B2B Comunitario (Directiva 2006/112/CE - Inversión del sujeto pasivo / Reverse Charge): resto de países UE tributan al 0%.
  - Resto del mundo: exento de IVA (0%).
  - Aritmética monetaria con redondeo a dos decimales (`Math.round(val * 100) / 100`) para evitar imprecisiones de coma flotante IEEE 754.
  - Blindaje de dominio: validación defensiva que lanza `DomainError` si `baseCost < 0` o `taxRate < 0`.

### 4.4. Resolución de Conflictos en Pruebas Unitarias (ESM/Jest en Node 22 + NestJS 12)
- **El problema técnico:** Al lanzar la suite de pruebas unitarias con Jest, surgieron tres errores en cascada ocasionados por la arquitectura ES Modules nativa de NestJS 12:
  1. *Conflicto de módulos ESM vs CommonJS (`Must use import to load ES Module`)* al resolver paquetes de `node_modules`.
  2. *Sintaxis inválida en interfaces de TypeScript (`SyntaxError: The requested module ... does not provide an export named 'CustomerRepositoryPort'`)*: al importar interfaces sin la cláusula `type`, TypeScript generaba sentencias de importación en runtime para elementos eliminados durante la transpilación a JavaScript.
  3. *Pérdida del objeto global `jest` (`ReferenceError: jest is not defined`)*: bajo el flag `--experimental-vm-modules`, Jest aísla los módulos y no inyecta `jest.fn()` en el ámbito global por defecto.
- **Solución técnica aplicada:**
  - Se creó `tsconfig.spec.json` configurando `module: "ESNext"` y `moduleResolution: "bundler"` para desacoplar el entorno de test del build de producción.
  - Se creó `jest.setup.ts` inyectando `import { jest } from '@jest/globals'; (globalThis as any).jest = jest;` y se vinculó en `jest.config.ts` (`setupFilesAfterEnv`), restaurando la disponibilidad global de `jest.fn()` en todas las pruebas.
  - Se auditó todo el código para forzar `import type { CustomerRepositoryPort }` en casos de uso, controladores y adaptadores, garantizando una separación limpia entre tipos de diseño e imports en tiempo de ejecución.

### 4.5. Control de Calidad en Tests: Consistencia de Idioma (Directriz 1.1)
- **Situación inicial:** La primera versión de `tax-calculator.service.spec.ts` se redactó con descripciones en español (`debería devolver...`) y comentarios explicativos inline dentro del cuerpo del test.
- **Tu intervención y auditoría:** Detectaste la incoherencia con el resto del proyecto: violaba la regla fundacional *"Código y tests en inglés, documentación en español"* acordada en la Sección 1.1, además de contener comentarios redundantes contrarios a la política de código limpio de la Sección 3.4.
- **Solución aplicada:** Se reescribió íntegramente en inglés (`describe('TaxCalculatorService')`, `it('should...')`), se limpiaron los comentarios que duplicaban el código y se añadieron aserciones para casos límite (códigos vacíos, desconocidos, espacios en blanco y lanzamiento de `DomainError` ante valores negativos).

### 4.6. Auditoría de Persistencia en `SimulationTypeOrmEntity`: Precisión Decimal, Inmutabilidad de Fechas y Supresión de `currency`
- **Los errores de la IA en la entidad de base de datos:**
  1. *Desnormalización artificial con `currency`:* Se incluyó una columna `@Column('varchar', { length: 3, default: 'EUR' }) currency` en SQLite.
  2. *Tipo de dato flotante para importes monetarios:* Se definieron `monthlyBaseCost`, `taxAmount` y `totalCost` como `@Column('float')`.
  3. *Mutación de fechas en infraestructura:* Se utilizó `@CreateDateColumn({ type: 'datetime' })` para `createdAt`.
- **Tu corrección y dirección técnica:**
  - *"El Word no te pide guardar la divisa, te pide guardar el cálculo en euros. Guardar 'EUR' en cada fila es guardar una constante 1000 veces sin aportar nada. Quita la columna de TypeORM y deja `currency: 'EUR'` en dominio y DTO"*.
  - *"Usar `float` para dinero está mal: en SQLite te puede transformar 29.40 en 29.3999999... Usa `decimal` con escala y precisión fija"*.
  - *"En DDD el dominio manda: `@CreateDateColumn` de TypeORM te pisa el `createdAt` que generó la entidad en su fábrica con su propio `NOW()`. Usa `@Column('datetime')` para respetar la fecha exacta del dominio"*.
- **Solución aplicada:**
  - Se eliminó la columna `currency` de la tabla SQLite; la divisa se mantiene como invariante en el Dominio y contrato en el DTO HTTP.
  - Se refactorizaron los campos monetarios a `@Column('decimal', { precision: 10, scale: 2 })` y la tasa a `@Column('decimal', { precision: 5, scale: 4 })` (dejando `storageGb` como `float`, ya que admite métricas como 10.5 GB).
  - Se cambió `createdAt` a `@Column('datetime')`, garantizando que la infraestructura persista con exactitud el timestamp originado en el dominio.

### 4.7. Auditoría del Mapeador de Persistencia: `Simulation.reconstitute` y Síntesis de `currency`
- **Los fallos iniciales en el Mapper:**
  1. *Uso de `Reflect.construct` con argumentos posicionales:* Se intentó instanciar `Simulation` mediante `Reflect.construct(Simulation, [entity.id, entity.customerId, ...])`.
  2. *Omisión de `currency` en la reconstitución:* Tras eliminar la columna `currency` de SQLite en el paso anterior, se omitió `currency` en `toDomain()`, provocando un fallo de compilación con la interfaz `SimulationProperties` (donde `currency` es un campo obligatorio).
- **Tu corrección y dirección técnica:**
  - *"En `Simulation`, el constructor no recibe 10 argumentos sueltos; recibe un único objeto `props: SimulationProperties`. Con `Reflect.construct` el id se pasaba como primer argumento y el resto quedaba en `undefined`. Usa el método canónico de fábrica `Simulation.reconstitute({ ... })`"*.
  - *"Como quitamos la columna de la BD, en `toDomain` no puedes dejar `currency` vacío porque en el dominio es obligatorio. Es aquí en el mapper donde debes inyectar la constante `'EUR'` al reconstituir, manteniendo el contrato tipado estricto sin ensuciar la base de datos"*.
  - *"El casteo `Number(...)` para los campos `decimal` es indispensable para blindar el dominio contra strings numéricos devueltos por el driver de TypeORM/SQLite"*.
- **Solución aplicada:** Se implementó `SimulationPersistenceMapper.toDomain` llamando a `Simulation.reconstitute({ ... })` con `currency: 'EUR'` explícito y con conversión numérica defensiva `Number(...)` en todos los importes decimales.

### 4.8. Driver de Persistencia SQLite y Carga Modular de Entidades (`better-sqlite3` vs `sqlite3` y `autoLoadEntities`)
- **Los fallos de configuración de la IA:** 
  1. *Tipo de driver inexistente en el ORM:* La IA intentó configurar TypeORM con `type: 'sqlite'`, provocando el error de compilación de TypeScript `ts(2322)`: `Type '"sqlite"' is not assignable to type 'DatabaseType'`.
  2. *Glob de rutas frágil:* Inicialmente se configuró la carga de entidades con una ruta relativa calculada con `__dirname` (`entities: [__dirname + '/../../../../modules/**/*.typeorm-entity{.ts,.js}']`), altamente propensa a romperse al transpilar a JavaScript en `dist/`.
- **Tu detección y corrección técnica:**
  - Me reportaste el error en caliente en `typeorm.config.ts`. Auditamos los tipos internos de TypeORM 1.1 (`DatabaseType`) y comprobamos que TypeORM eliminó el driver legacy `'sqlite'` (paquete `sqlite3` asíncrono de callbacks) en favor de `'better-sqlite3'` (driver síncrono nativo, mucho más rápido y sin fugas de memoria).
  - Se corrigió el tipo a `type: 'better-sqlite3'` instalando `better-sqlite3` y sus tipos.
  - Se sustituyó el glob frágil por `autoLoadEntities: true`, haciendo que cada módulo (`CustomersModule`, `SimulationsModule`) registre sus entidades de forma verdaderamente modular mediante `TypeOrmModule.forFeature()`.

### 4.9. Naming Semántico y Convención Enterprise: `mic-saas-omatic` y `spa-saas-omatic`
- **El error de la IA:** La carpeta raíz del servidor NestJS se scaffoldeó inicialmente como `api/` y el frontend como `dashboard/`.
- **Tu corrección y dirección técnica (feedback de Andrés, evaluador de Roams):**
  - *"Si a mí me pones todo el código en una carpeta llamada api y me dices que eso es una API, es un KO aunque esté todo lo demás OK. Una API es un YAML, un contrato."*
  - *"Yo le llamaría `mic-saas-omatic` (microservicio backend) y el otro `spa-saas-omatic` (Single Page Application Angular)."*
- **Razonamiento técnico:**
  - En la industria y en proyectos corporativos maduros, una **API** es la especificación o contrato de interfaz (el `openapi.yaml` que reside en `01-specs/`). Llamar `api` a la implementación entera del backend confunde la especificación con la implementación de software.
  - La nomenclatura prefijada `mic-` (Microservicio NestJS) y `spa-` (Single Page Application Angular) refleja con exactitud la naturaleza del artefacto desplegable y sigue las convenciones habituales de repositorios multi-proyecto / monorepos corporativos.
- **Solución aplicada:**
  - Renombrado de `api/` a `mic-saas-omatic/` y de `dashboard/` a `spa-saas-omatic/` mediante `git mv` para preservar el historial atómico de commits en Git.
  - Actualización de `"name": "mic-saas-omatic"` en `mic-saas-omatic/package.json`.
  - Actualización de `"name": "spa-saas-omatic"` en `spa-saas-omatic/package.json`.
  - Actualización del árbol canónico en `architecture-guidelines.md`.

---

## Sección 5: Decisiones de Arquitectura Avanzada y Desacoplamiento de Módulos

### 5.1. Desacoplamiento de Bounded Contexts: `GET /simulations?customerId=` vs `forwardRef`

- **Situación inicial:** `GET /customers/:id` devolvía el cliente con un array `simulations: []` hardcodeado (placeholder). Para poblarlo había que inyectar `SIMULATION_REPOSITORY_PORT` en `CustomersModule`, lo que creaba una **dependencia circular**:
  - `SimulationsModule` → importa `CustomersModule` (para verificar que el cliente existe al crear una simulación)
  - `CustomersModule` → importaría `SimulationsModule` (para leer el historial de simulaciones)
- **Opciones evaluadas:**
  1. **`forwardRef` (Opción 1):** Parche de NestJS para romper el ciclo. Funciona, pero es un *code smell* reconocido por la comunidad: indica que dos módulos que debían ser independientes están acoplados en ambas direcciones.
  2. **2 endpoints independientes (Opción 2):** `GET /customers/:id` devuelve el cliente plano. El historial se consulta con `GET /simulations?customerId=:id` en su propio bounded context. El frontend compone ambas respuestas en paralelo (`forkJoin`).
  3. **Puerto de consulta con inversión de dependencia (Opción 3):** Interfaz `CustomerSimulationsPort` en `Customers` implementada por `Simulations`. Mantiene la respuesta unificada pero añade capas y sigue requiriendo resolución de ciclo en el wiring de NestJS.
- **Decisión tomada (Opción 2):** Se eligió el enfoque REST puro con dos endpoints desacoplados por las siguientes razones:
  - **DDD puro:** Un `Customer` y su historial de facturación son dos Bounded Contexts distintos. `CustomersModule` no tiene razón de negocio para conocer la estructura interna de `SimulationsModule`.
  - **Sin deuda técnica:** Cero `forwardRef`, cero acoplamiento circular.
  - **Escalabilidad:** Si en el futuro `Simulations` se extrae a un microservicio, `Customers` no se toca.
  - **Componibilidad en el frontend:** `forkJoin([getCustomer(id), getSimulations(id)])` es un patrón estándar en Angular y más eficiente (peticiones paralelas).
- **Cambios aplicados:**
  - Nuevo use-case `ListSimulationsByCustomerUseCase` en `simulations/application/use-cases/`.
  - `SimulationController` recibe `GET /simulations?customerId=:id` y delega al nuevo use-case.
  - `CustomerController.getById` devuelve `CustomerResponseDto` plano (no `CustomerDetailResponseDto`).
  - `openapi.yaml` actualizado: `GET /customers/{id}` devuelve `Customer`, `GET /simulations` documenta el query param `customerId`.
  - Eliminado el schema `CustomerWithSimulations` del contrato OpenAPI.

### 5.2. Auditoría de la Pirámide de Testing: Cobertura E2E contra SQLite Real y Pipeline HTTP

- **El sesgo de la IA y situación inicial:** La IA cayó en el sesgo típico de los copilotos generativos: tras desarrollar los componentes fichero a fichero acompañados de sus tests unitarios aislados con mocks, declaró apresuradamente la API como "100% completada y probada". Omitió por completo el escalón intermedio y superior de la pirámide de pruebas (integración y E2E), dejando intacto en `test/app.e2e-spec.ts` el test residual del scaffolding inicial (`Hello World!`).
- **Tu intervención y dirección técnica:** Me frenaste en seco con una auditoría crítica de calidad: *"Un momento, revisa si los tipos de tests están cubiertos, los de integración y unitarios"*.
- **La carencia arquitectónica detectada:**
  - Los adaptadores de persistencia (`CustomerPersistenceAdapter`, `SimulationPersistenceAdapter`) solo estaban testeados unitariamente falseando el `Repository` de TypeORM con mocks de Jest.
  - No existía ninguna prueba que levantara la aplicación NestJS completa con una base de datos SQLite real para verificar:
    1. **Persistencia y Driver Real:** Que `better-sqlite3` ejecuta las sentencias SQL reales, respeta la inmutabilidad de fechas `@Column('datetime')` generadas por el dominio, no trunca importes monetarios decimales y resuelve la búsqueda con comodines `Like(...)`.
    2. **Pipeline HTTP Integral:** Que `ValidationPipe` (con `whitelist` y `forbidNonWhitelisted`) y el filtro global RFC 7807 (`application/problem+json`) operan en armonía ante llamadas HTTP reales (`supertest`).
- **Solución técnica implementada:**
  - Se adaptó `test/jest-e2e.json` para ejecutar bajo ES Modules nativo en NestJS 12 (`useESM`, `tsconfig.spec.json`, mapeador de imports).
  - Se creó `test/setup-e2e.ts` y se configuró `typeorm.config.ts` con `process.env.DATABASE_NAME || 'saas_o_matic.sqlite'` para aislar la base de datos de pruebas bajo `saas_o_matic.test.sqlite` (limpiándola automáticamente en `beforeAll` y `afterAll` sin alterar los datos de desarrollo).
  - Se implementó la suite completa de integración `test/saas-o-matic.e2e-spec.ts` con `supertest`, validando:
    - Registro de cliente con CIF español válido (`201 Created`).
    - Rechazo de CIF inválido mediante algoritmo fiscal con cabecera `application/problem+json` (`400 Bad Request`).
    - Detección de duplicidad de `taxId` normalizado (`409 Conflict`).
    - Búsqueda insensible a mayúsculas y tolerante a guiones (`GET /customers?search=b-1234`).
    - Consulta de cliente por ID (`200 OK`) y recurso no encontrado (`404 Not Found`).
    - Simulación con cálculo de tramos e IVA español para 15 usuarios (140 € base + 29.40 € IVA = 169.40 €).
    - Simulación multi-país para cliente alemán (19% MwSt sobre 470 € base = 559.30 € total).
    - Rechazo de métricas negativas (`400 Bad Request` con `invalidParams`).
    - Historial cronológico de simulaciones por cliente (`GET /simulations?customerId=...`).

### 5.3. Depuración y Estabilización E2E: Bloqueos de SQLite y Validación en Capas (Sintáctica vs Semántica)

- **Situación al ejecutar `npm run test:e2e`:** Tras generar la suite de integración, 11 tests pasaron en verde pero surgieron 2 fallos y una advertencia de base de datos bloqueada en el terminal:
  1. `QueryFailedError: SqliteError: database is locked`: TypeORM fallaba al intentar sincronizar el esquema.
  2. `POST /simulations` devolvía `400 Bad Request` en lugar de `404 Not Found` al simular con un cliente inexistente.
  3. `GET /customers/:id` fallaba por aserción de texto en el mensaje de error de detalle.
- **Auditoría técnica de las causas:**
  - *Bloqueo concurrente de SQLite:* Jest ejecuta los ficheros de pruebas en paralelo por defecto utilizando múltiples procesos trabajadores (*workers*). Tanto `app.e2e-spec.ts` como `saas-o-matic.e2e-spec.ts` levantaron sendas instancias de la aplicación NestJS que intentaron ejecutar `DataSource.synchronize()` sobre el mismo archivo `saas_o_matic.test.sqlite` en el mismo milisegundo. Al ser SQLite un motor de base de datos embebido monoproceso para escrituras, la segunda conexión quedó bloqueada.
  - *Precedencia de validación (Transporte DTO vs Negocio):* La IA utilizó `'11111111-1111-1111-1111-111111111111'` como identificador falso en el test de simulación, esperando que el caso de uso lanzara `EntityNotFoundError` (404). Sin embargo, esa cadena no cumple la estructura formal de un **UUID v4** (el carácter de versión debe ser `4`). El `ValidationPipe` global con `@IsUUID('4')` en `CreateSimulationDto` interceptó la petición en la capa de transporte HTTP y la rechazó legítimamente con `400 Bad Request` antes de que alcanzara la base de datos o el caso de uso.
  - *Discrepancia en mensaje de dominio:* El test esperaba el texto `"with identifier"`, mientras que la excepción pura de dominio `EntityNotFoundError` genera `"with id"`.
- **Solución aplicada:**
  - Se configuró `"maxWorkers": 1` en `mic-saas-omatic/test/jest-e2e.json` para forzar la ejecución secuencial determinista de los tests de integración sobre SQLite.
  - Se corrigió el test utilizando un UUID v4 sintácticamente perfecto pero inexistente en base de datos (`'b0000000-0000-4000-8000-000000000000'`), demostrando en la suite la separación real entre validación sintáctica de DTOs (400) y validación semántica de existencia en dominio (404).
  - Se alineó la aserción con la plantilla oficial de `EntityNotFoundError` (`"Customer with id '...' was not found."`).

### 5.4. Estrategia de Ejecución de Pruebas: Desacoplamiento de Feedback Loops y Script `test:all`

- **Dilema técnico planteado:** ¿Deben ejecutarse los tests unitarios y de integración juntos en un único comando o mantenerse en comandos independientes?
- **Auditoría de mejores prácticas enterprise:**
  - *Desarrollo local iterativo (TDD / Vibe Coding):* Deben mantenerse separados. Los tests unitarios (`npm test`) se resuelven en memoria en menos de 1 segundo mediante mocks, permitiendo un ciclo de realimentación inmediato (*instant feedback loop*) con `npm run test:watch`. Por contra, los tests de integración (`npm run test:e2e`) levantan el servidor HTTP real, realizan operaciones de I/O contra SQLite en disco y sincronizan el esquema de la base de datos, lo que introduciría una fricción temporal inasumible si se ejecutaran a cada guardado de archivo.
  - *Pipelines de CI/CD y control pre-commit:* En etapas de integración continua o justo antes de consolidar un commit en Git, es imprescindible validar **la totalidad de la pirámide de pruebas** en una sola orden encadenada que aplique la política de *fail-fast* (si fallan los unitarios, no se ejecutan los E2E).
- **Solución implementada:**
  - Se añadió el script unificado `"test:all": "npm test && npm run test:e2e"` en `mic-saas-omatic/package.json`.
  - Se documentó la filosofía de feedback loops y la tabla de comandos en la Sección 4.2 de `architecture-guidelines.md`.

### 5.5. Auditoría de Rendimiento y Concurrencia: SQLite WAL vs. Fastify vs. Clustering

- **Pregunta técnica y contexto (Paralelismo con Spring Boot):** Se planteó si en NestJS existía alguna configuración equivalente a los *Virtual Threads* de Java 21 (`spring.threads.virtual.enabled=true`) para maximizar el rendimiento.
- **Análisis del modelo de ejecución (Java vs. Node.js):**
  - En Spring Boot tradicional, cada petición ocupa un hilo del Sistema Operativo (~1 MB de memoria). Los Virtual Threads nacen para sustituir esos hilos por corrutinas ligeras y evitar el colapso por cambio de contexto en I/O bloqueante.
  - En Node.js / NestJS, **el Event Loop (reactor pattern con `libuv`) es no bloqueante por diseño** desde el primer día. Las operaciones de red y sockets no retienen hilos del SO; por tanto, no existe ni se necesita una bandera de "hilos virtuales".
- **Evaluación y dictamen sobre las 3 palancas de rendimiento:**
  1. *Motor HTTP (Fastify vs. Express):* **Descartada conscientemente.** Express atiende holgadamente más de 10.000 req/s. Cambiar el adaptador a Fastify aportaría sobre-ingeniería sin beneficio perceptible para una herramienta comercial interna.
  2. *Concurrencia en Base de Datos (SQLite WAL Mode):* **APLICADA.** Se activó `enableWAL: true` en `typeOrmSqliteConfig` (`better-sqlite3`). SQLite opera por defecto con *Rollback Journal* (las escrituras bloquean a los lectores). Con el modo WAL (*Write-Ahead Logging*), las lecturas y las escrituras se desacoplan por completo, permitiendo que múltiples comerciales consulten clientes mientras se persisten simulaciones simultáneamente.
  3. *Multi-proceso / Clustering:* **Descartada conscientemente.** En arquitecturas con SQLite embebido, levantar un clúster de múltiples procesos Node.js compitiendo por el bloqueo del archivo local en disco es contraproducente. La arquitectura canónica recomendada es un único proceso Node.js optimizado con el driver C++ nativo de `better-sqlite3`.

### 5.6. Swagger UI y Spec-Driven Development: Documentación Viva sin Deuda Técnica

- **Dilema de diseño habitual:** En NestJS, la práctica común (*Code-First*) consiste en decorar controladores y DTOs con docenas de anotaciones (`@ApiProperty()`, `@ApiOperation()`, `@ApiResponse()`). Esto llena la infraestructura de ruido visual y tiende a divergir de los contratos iniciales.
- **Enfoque Spec-Driven Development (API-First):** Nuestro contrato oficial ya fue diseñado exhaustivamente en `ai-workspace/01-specs/openapi.yaml` como **Fuente Única de Verdad** antes de escribir código.
- **Solución implementada:** Se integró `@nestjs/swagger` y `yaml` en `mic-saas-omatic/src/main.ts` cargando dinámicamente el documento `openapi.yaml` para servir la interfaz gráfica interactiva de Swagger en **`http://localhost:3000/docs`**.
- **Beneficio para la evaluación:** El evaluador puede interactuar con la API directamente desde su navegador con el botón *"Try it out"* sin necesidad de Postman, manteniendo el código fuente libre de decoradores de documentación.

---

## Sección 6: Frontend (Angular 22), Sistema de Diseño y Estado Reactivo

### 6.1. Decisión de Arquitectura UI: Pragmatismo Senior (Angular Material + SCSS) vs. Hype (Tailwind)

- **El debate inicial impulsado por la IA:** Ante la pregunta de qué librería de estilos utilizar, las propuestas iniciales cayeron en la tentación del *hype* ("lo que está de moda"), sugiriendo Tailwind CSS o PrimeNG bajo la premisa de que "Bootstrap está obsoleto y Material parece de Google". Incluso se plantearon textos con ambigüedades del tipo *"Material (o Bootstrap)"* y *"Grid (o Flexbox)"*.
- **Tu dirección técnica de Director de Orquesta:**
  - *"En una arquitectura profesional no se dejan 'o'; las decisiones son taxativas y se cierran."*
  - *"Regla de oro: no metes en el proyecto nada que no puedas defender con los ojos cerrados en la entrevista. Si te preguntan por la purga de clases o directivas de Tailwind y dudas, ya has perdido."*
  - SaaS-O-Matic es un **dashboard comercial interno**, no una landing page de marketing. Requiere componentes accesibles (a11y), sliders de precisión, selects y tablas de datos robustas y probadas desde el minuto uno.
  - Angular Material resuelve de forma nativa la accesibilidad del slider, los formularios y los selects.
  - El aspecto genérico de Google se elimina al 100% mediante una capa de **personalización en SCSS** con los colores corporativos de Roams (azul marino casi navy, acento verde/cian, tarjetas y botones con `border-radius: 16px`).
- **El pitch de defensa consolidado:**
  > *"Elegí Angular Material porque para un dashboard comercial interno necesitaba componentes robustos y un slider accesible de serie. Con una capa de SCSS lo customicé para que no pareciera una app genérica de Google sino una herramienta corporativa de Roams. Tailwind me habría obligado a implementar la accesibilidad y el comportamiento del slider desde cero, desviando el foco del reto."*
- **Solución aplicada:** Se cerró formalmente en la Sección 3.2 de `architecture-guidelines.md` la decisión de **Angular Material + SCSS Custom + CSS Grid/Flexbox nativo**, descartando tajantemente Bootstrap.

### 6.2. Estructura de Proyecto en Frontend: Organización Modular (`modules/`) y Simetría 1:1 con Backend vs. Capas Técnicas (`core/`)

- **La propuesta inicial de la IA:** La IA planteó agrupar todos los modelos de datos en una carpeta global `src/app/core/models/` y todos los servicios en `src/app/core/services/` (*Technical Layering* tradicional).
- **La intervención y corrección del Director de Orquesta (Doble control arquitectónico):**
  1. *Freno al "cajón de sastre":* El usuario ordenó no juntarlo todo en `core/` y estructurar el Frontend por módulos funcionales autónomos.
  2. *Simetría de Nomenclatura 1:1 (`modules/` vs `features/`):* Cuando la IA propuso usar la carpeta `features/` (convención clásica de Angular), el usuario volvió a intervenir corrigiendo la nomenclatura a **`modules/`**:
     > *"¿Por qué features y no modules mejor? En el backend tenemos `src/modules/customers` y `src/modules/simulations`. Si en el frontend usamos `src/app/modules/...`, la simetría es total y el mapa conceptual del proyecto es exactamente el mismo."*
- **Estructura final adoptada:**
  1. **Módulo `modules/customers/`:** Contiene sus propios modelos (`customer.model.ts`), sus servicios (`customer-api.service.ts`), sus componentes tontos de presentación (`customer-card`, `customer-search-bar`) y sus páginas inteligentes (`customer-list`, `customer-detail`).
  2. **Módulo `modules/simulations/`:** Contiene sus modelos (`simulation.model.ts`), servicios (`simulation-api.service.ts`), utilidades de cálculo local (`local-pricing-calculator.ts`), componentes de interacción (`simulation-slider`, `simulation-projection`) e historial (`simulation-history-list`).
  3. **Área `core/` reducida a lo estrictamente transversal:** Solo alberga utilidades globales de aplicación, como la integración con la API pública de tipos de cambio (`currency.service.ts`, `currency.model.ts`) y la especificación de errores RFC 7807 (`problem-detail.model.ts`).
  4. **Área `shared/`:** Para componentes visuales compartidos (la Navbar corporativa de Roams, selectores globales de divisa, banner de avisos).
- **Valor para la evaluación técnica:** Demuestra liderazgo y visión holística de arquitectura de software. Un monorrepo con simetría de carpetas (`src/modules/...` en backend y frontend) reduce la carga cognitiva del equipo y evidencia un diseño coherente de principio a fin.

### 6.3. Limpieza de Ruido IA: Código Autodocumentado (Clean Code) vs. "Paja" de Comentarios Robóticos y Auditoría de Contratos DTO

- **La sugerencia inicial de la IA y la intervención del Director de Orquesta:**
  - La IA comenzó a redactar bloques de comentarios JSDoc obvios encima de cada interfaz (`/** Payload to create a simulation */`, `/** Persisted corporate customer */`).
  - El usuario detuvo en seco la generación de "paja" sintética:
    > *"¿Este tipo de comentarios no parece muy robótico o por IA? Toda esa paja de comentarios sobra. El código habla por sí solo por el naming."*
- **Principio Senior aplicado (Clean Code):**
  - Las interfaces con nombres auto-descriptivos (`Customer`, `CustomerCreate`, `Simulation`, `SimulationCreate`) no necesitan redundancia explicativa. Añadir comentarios obvios no solo revela código artificial generado por bots sin criterio, sino que introduce deuda técnica (comentarios desactualizados en refactorizaciones).
  - Los comentarios se restringen únicamente a intenciones arquitectónicas o de UI no evidentes, como indicar que `SimulationProjection` es un modelo en memoria exclusivo del slider que no se persiste en backend.
- **Auditoría de correspondencia 1:1 con Backend (`mic-saas-omatic`):**
  - A raíz de la exigencia expresa del usuario de contrastar los modelos TypeScript contra lo que realmente emite el backend, se inspeccionaron `CustomerResponseDto`, `SimulationResponseDto` y `openapi.yaml`.
  - **Caza de bug en tiempo de diseño (Contratos Desalineados):**
    - La IA había colado en el borrador de `Customer` un campo fantasma: `isActive: boolean;`.
    - Al auditar `CustomerResponseDto` en `mic-saas-omatic/src/modules/customers/infrastructure/adapters/in/rest/dto/customer-response.dto.ts` y el esquema `Customer` de `openapi.yaml`, se constató que la entidad solo emite: `id`, `companyName`, `taxId`, `email`, `country`, `selectedPlan` y `createdAt`.
    - El usuario ordenó corregir de inmediato el modelo eliminando `isActive: boolean` antes de que se propagara a los componentes y servicios del frontend:
      ```typescript
      export interface Customer {
        id: string;
        companyName: string;
        taxId: string;
        email: string;
        country: string;
        selectedPlan: string;
        createdAt: string;
      }

      export interface CustomerCreate {
        companyName: string;
        taxId: string;
        email: string;
        country: string;
        selectedPlan: string;
      }
      ```
  - **Conclusión de la auditoría:** Se blindó la paridad tipada 1:1 estricta entre el contrato REST OpenAPI, la capa de presentación de NestJS y los modelos de Angular.
  - **Estandarización de Errores con RFC 7807 (Frontend y Backend alineados):**
    - El usuario validó explícitamente incluir la cabecera canónica de estándar (`// RFC 7807 Problem Details for HTTP APIs (application/problem+json)`) en `problem-detail.model.ts`.
    - Criterio de arquitectura: Citar la especificación IETF oficial no es "ruido de IA", sino trazabilidad de estándar. Garantiza que cualquier consumidor del frontend sabe que las respuestas de fallo ($\ge 400$) recibidas desde NestJS son procesadas homogéneamente a través del contrato `ProblemDetail` (`type`, `title`, `status`, `detail`, `instance`, `invalidParams`, `timestamp`).

### 6.4. Separación de Errores (`core/errors/`) vs. Divisas en `core/` y Preservación de la Simetría de Módulos

- **El primer error de acoplamiento cometido por la IA:** La IA colocó en una misma carpeta genérica `core/models/` el formato estándar de errores HTTP RFC 7807 (`problem-detail.model.ts`) junto con los tipos de cambio de moneda (`currency.model.ts`), recreando un "cajón de sastre".
- **La primera corrección del Director de Orquesta:**
  > *"Dos cosas que no me gustan: una es juntar en el mismo directorio un modelo de errores globales con la data de las monedas de la app. Arréglalo y mételo en los MDs para que vean que te corregí."*
- **El sobreajuste de la IA y el segundo freno del Director de Orquesta:**
  - Ante esa indicación, la IA sobre-reaccionó e intentó crear una carpeta `modules/currency/`.
  - El usuario detectó de inmediato el fallo arquitectónico y le paró los pies a la IA:
    > *"No entiendo lo de currency en modules, ¿no estaba bien ya en core?"*
  - **Dictamen del usuario:** En el backend NestJS solo existen dos módulos funcionales (`modules/customers` y `modules/simulations`). El backend opera exclusivamente en EUR; por tanto, las divisas son una responsabilidad transversal del frontend (utilizada por la Navbar global, el slider y las tablas), no un módulo de dominio del backend. Meter `currency` en `modules/` rompía la simetría 1:1 con el backend.
- **Solución arquitectónica final consolidada:**
  1. *Errores aislados en infraestructura:* `src/app/core/errors/problem-detail.model.ts` (contrato de red HTTP para fallos $\ge 400$).
  2. *Divisas en el Core transversal:* `src/app/core/models/currency.model.ts` y `src/app/core/services/currency.service.ts`.
  3. *Módulos funcionales puros (Simetría 1:1 con backend):* `src/app/modules/customers/` y `src/app/modules/simulations/`.
- **Impacto para la evaluación:** Muestra a un Director de Orquesta con criterio firme que no se deja llevar por la inercia de la IA, manteniendo las carpetas de negocio limpias y preservando la simetría estricta de dominios entre backend y frontend.

### 6.5. Patrón de Tipado para Dominios Cerrados: `as const` (Estándar de Oro en TypeScript) vs. `enum` Legacy

- **Dilema técnico planteado por el usuario:**
  > *"¿No es mejor un enum? `export type CurrencyCode = 'EUR' | 'USD' | ...;`"*
- **Auditoría arquitectónica (Evaluación de alternativas):**
  1. *Descarte del `enum` legacy de TypeScript:* Genera código JavaScript compilado adicional en el bundle (funciones autoejecutables IIFE), añade fricción innecesaria en plantillas de Angular (obliga a declarar `readonly CurrencyCode = CurrencyCode` en el componente para usarlo en el HTML) y requiere castings forzados ante respuestas JSON de APIs externas.
  2. *Descarte del `type` puro aislado:* Desaparece completamente en tiempo de ejecución, impidiendo iterar sobre los valores (`.map()`) para poblar dinámicamente desplegables de Angular Material (`<mat-select>`).
- **Decisión del Director de Orquesta:** Se adoptó el patrón **`as const` con tipo derivado**:
  ```typescript
  export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY'] as const;
  export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];
  ```
- **Beneficios técnicos contrastados:**
  1. *Fuente única de verdad:* Modificar o añadir una divisa solo requiere editar el array base inmutable.
  2. *Runtime + Tipado Estricto:* Proporciona un array en tiempo de ejecución para iterar en la UI y un tipo unión de strings exacto en tiempo de diseño.
  3. *Cero código legacy:* Código limpio, compatible con estándares ECMAScript y con mínimo coste de bundle.

### 6.6. Prevención de Deuda Técnica en Angular 22: Análisis de Deprecación (`provideAnimationsAsync` y `withFetch`)

- **La inercia de la IA (Patrones legados de Angular 17/18):**
  - La IA propuso por costumbre de versiones anteriores incluir `provideAnimationsAsync()` y `provideHttpClient(withFetch())` en `app.config.ts`.
- **La detección y cuestionamiento del Director de Orquesta:**
  - El usuario advirtió inmediatamente ambas advertencias del compilador TypeScript y exigió una auditoría técnica profunda:
    > *"Ojo con esto: `provideAnimationsAsync` is deprecated (Intent to remove in v23) y `withFetch` is deprecated (FetchBackend is default). Si están deprecated, ¿son problemas de optimización, compatibilidad, seguridad o de qué? Documenta ambos fallos."*
- **Auditoría Técnica Exhaustiva de las 2 Deprecaciones:**

  | Función Deprecada | Categoría del Problema | Causa Raíz Arquitectónica | Impacto si se Mantiene |
  | :--- | :--- | :--- | :--- |
  | **`provideAnimationsAsync`** | **Optimización (Rendimiento/Bundle) y Compatibilidad Futura** | Históricamente, `@angular/animations` era un motor en JavaScript que parseaba DSL propio (`trigger`, `transition`) y manipulaba el DOM bloqueando el hilo principal (*Main Thread*). Los estándares web modernos han evolucionado hacia la **Web Animations API** y transiciones CSS aceleradas por hardware (GPU). Además, el equipo de Angular programó su **eliminación definitiva en Angular 23** (`Intent to remove in v23`). Angular Material 3 ya no depende de este motor. | *Penalización de rendimiento:* Sobrecarga del bundle con KB innecesarios y riesgo de *jank* (tirones visuales). *Ruptura garantizada:* Código roto al actualizar a Angular 23. |
  | **`withFetch()`** | **Compatibilidad de Runtimes, Estandarización y Deuda Técnica** | Durante años, `HttpClient` utilizó `XMLHttpRequest` (XHR), una API heredada de los años 2000 no apta para entornos modernos sin DOM (Service Workers, Edge Runtimes como Cloudflare Workers o Vercel Edge). En Angular 17 se introdujo `withFetch()` de forma optativa. En **Angular 22**, la migración culminó: `FetchBackend` es el backend por defecto de Angular. Pasar `withFetch()` es código redundante que no aporta funcionalidad y añade ruido visual. | *Confusión en arquitectura:* Genera falsas dudas al equipo sobre qué motor HTTP se ejecuta. *Deuda de API:* Provoca warnings en build y será suprimido en próximas versiones. |

- **Acción correctora ejecutada:** Se saneó `app.config.ts` eliminando ambas funciones obsoletas y dejándolo exclusivamente con los proveedores canónicos limpios de Angular 22:
  ```typescript
  export const appConfig: ApplicationConfig = {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      provideHttpClient(),
    ],
  };
  ```
- **Valor para la evaluación técnica:** Demuestra criterio de nivel Staff/Principal Engineer. No solo se eliminan las advertencias superficialmente, sino que se comprende el trasfondo técnico: ahorro de bundle, descarga del hilo principal a la GPU del navegador, compatibilidad con Edge/SSR y blindaje frente a breaking changes en Angular 23.

### 6.7. Higiene de Código en Estilos: Purga de Ruido y Duplicidad en `styles.scss`

- **La generación sucia del CLI:** El comando `ng add @angular/material` generó 77 líneas de código en `styles.scss` repletas de comentarios didácticos redundantes para principiantes e inyectó el bloque `@include mat.theme(...)` duplicado por duplicación de inserción.
- **La corrección del Director de Orquesta:**
  - El usuario auditó el fichero antes de consolidar el commit de la fase:
    > *"Ojo con todos estos comentarios y bloques repetidos."*
- **Acción correctora ejecutada:** Se eliminó toda la "paja" de comentarios tutoriales y el bloque repetido, reduciendo el archivo de 77 a 24 líneas limpias de SCSS profesional.
- **Valor para la evaluación:** Transmite excelencia en *Clean Code*. Un repositorio senior no incluye comentarios autogenerados de scaffolding de CLI ni bloques de estilos repetidos.

### 6.8. Resiliencia de Red y Adopción Canónica de `about:blank` en RFC 7807 (Frontend y Especificaciones)

- **La observación crítica del Director de Orquesta:**
  - Al revisar el método de captura de errores `handleError` en `CustomerApiService`, el usuario cuestionó una URI sintética introducida por la IA:
    > *"No entiendo el type este, explícamelo: `https://errors.saas-o-matic.com/unknown`. Cámbialo a `about:blank` y mételo en los MDs correspondientes tanto si impacta al front como a la API."*
- **Auditoría del Estándar IETF RFC 7807:**
  - El campo `type` de un Problem Detail debe ser una URI que identifique la categoría de error.
  - La IA había introducido una URL inventada (`.../unknown`) para el caso de contingencia (cuando la llamada falla a nivel de red antes de llegar a NestJS: servidor caído, desconexión de red, timeout o status 0).
  - La Sección 4.2.1 del estándar RFC 7807 prescribe textualmente: *«When no specific URI documentation exists, its value is assumed to be "about:blank"»*.
- **Acción correctora ejecutada:**
  1. *En Frontend (`customer-api.service.ts`):* Se sustituyó la URI ficticia por la canónica `type: 'about:blank'` para el objeto defensivo de fallback de red.
  2. *En Especificaciones Funcionales (`functional-specs.md`, Sección 4):* Se formalizó la regla: los errores originados en backend emiten su URI con código de estado (`https://errors.saas-o-matic.com/${status}`), mientras que los fallos de conectividad o sin documentación externa adoptan canónicamente `'about:blank'`.
- **Valor para la evaluación:** Muestra rigor en estándares internacionales (IETF), eliminando URIs ficticias o arbitrarias y alineando la resiliencia de red de cliente con la especificación de la API.

### 6.9. Anti-patrón de URLs Hardcodeadas vs. Centralización en Entornos (`environments/environment.ts`)

- **El fallo detectado por el Director de Orquesta:**
  - Al revisar los servicios HTTP, el usuario detectó que la IA había incrustado URLs a fuego en la clase (`private readonly baseUrl = 'http://localhost:3000/customers';`).
  - Intervención inmediata:
    > *"¿Esto no se mete en configuraciones globales, envs o algo así?"*
- **Análisis arquitectónico (12-Factor App & Configuración desacoplada):**
  - Hardcodear URLs locales (`localhost:3000`) en los servicios es un *code smell* que impide la portabilidad: cuando la SPA se despliegue en Docker, Nginx o producción, obligaría a buscar y reemplazar cadenas dispersas por todo el código fuente.
  - La práctica estándar de la industria es centralizar las variables de entorno para que el origen de la API sea configurable sin alterar la lógica de negocio.
- **Solución técnica implementada:**
  - Se creó `spa-saas-omatic/src/environments/environment.ts`:
    ```typescript
    export const environment = {
      production: false,
      apiBaseUrl: 'http://localhost:3000',
      currencyApiUrl: 'https://open.er-api.com/v6/latest/EUR',
    };
    ```
  - Se inyectó `environment.apiBaseUrl` en `CustomerApiService` y `SimulationApiService`, y `environment.currencyApiUrl` en `CurrencyService`.
- **Valor para la evaluación:** Garantiza preparación para entornos multi-contenedor (Docker Compose) y despliegues productivos limpios sin deuda técnica.

### 6.10. Principio DRY y Arquitectura Enterprise de Errores: Desacoplamiento de Servicios mediante `errorInterceptor`

- **La objeción crítica del Director de Orquesta:**
  - Al revisar los métodos privados de error en los servicios HTTP, el usuario frenó la duplicación de código:
    > *"Esto me parece horrible: 'An unexpected error occurred while communicating with the server.'. Si tenemos en el proyecto con el tiempo 50 servicios http se repetirá 50 veces el mismo texto. Centralízalo en un HttpInterceptor."*
- **Análisis arquitectónico (Violación de DRY y Acoplamiento de Transporte):**
  - Cada servicio de dominio (`CustomerApiService`, `SimulationApiService`) estaba asumiendo la responsabilidad de parsear `HttpErrorResponse`, verificar si existía el cuerpo de error y construir objetos sintéticos de contingencia con textos literales idénticos.
  - En una arquitectura enterprise con decenas de servicios, este antipatrón multiplica la deuda técnica: un cambio de texto o de política de resiliencia exigiría modificar 50 archivos.
- **Solución implementada (Arquitectura desacoplada con HttpInterceptor):**
  1. *Creación de `errorInterceptor.ts` funcional:* Ubicado en `src/app/core/errors/error.interceptor.ts`. Intercepta globalmente cualquier fallo HTTP. Si la respuesta contiene el JSON RFC 7807 de NestJS, lo propaga directamente tipado; si es una desconexión de red (status 0) o un error sin cuerpo, genera de forma centralizada el `ProblemDetail` normalizado con `type: 'about:blank'`.
  2. *Registro global en `app.config.ts`:* `provideHttpClient(withInterceptors([errorInterceptor]))`.
  3. *Saneamiento radical de los servicios:* Se eliminó el método `handleError` y todo texto duplicado de los servicios. Ahora los servicios simplemente reciben el `ProblemDetail` ya normalizado por el interceptor y actualizan su Signal `error.set(problem)`.
  4. *Suite de pruebas del interceptor:* Se creó `src/app/core/errors/error.interceptor.spec.ts` para verificar la normalización de red y la propagación de RFC 7807.
- **Valor para la evaluación:** Refleja madurez técnica sobresaliente. Se pasa de servicios sobrecargados con lógica repetitiva de transporte a una arquitectura limpia, declarativa y escalable a cientos de endpoints.

### 6.11. Adaptación a Vitest en Angular 22: Corrección de `fail()` a `throw new Error()`

- **El error de inercia de la IA:** La IA escribió los tests unitarios utilizando la función global `fail('should have failed...')`, asumiendo el entorno tradicional de Jasmine / Karma.
- **Detección del error en tiempo de compilación:**
  - Al ejecutar `npm test`, el compilador arrojó `TS2304: Cannot find name 'fail'`.
  - Causa raíz: Angular 22 ha migrado su ejecutor de pruebas predeterminado a **Vitest**, donde `fail()` no es un identificador global inyectado.
- **Acción correctora ejecutada:** Se sustituyó en todos los specs (`customer-api.service.spec.ts`, `simulation-api.service.spec.ts`, `error.interceptor.spec.ts`) por el estándar universal ECMAScript:
  ```typescript
  next: () => {
    throw new Error('should have failed with 400');
  }
  ```
- **Valor para la evaluación:** Demuestra capacidad para diagnosticar discrepancias de tooling entre Jasmine y Vitest en Angular 22, asegurando tests limpios y portables.

### 6.12. Experiencia de Evaluación (DX) y Configuración de Scripts de Test: Pase Único (`--watch=false`) vs. Modo Interactivo (`test:watch`)

- **La fricción detectada por el Director de Orquesta:**
  - Al ejecutar `npm test`, el proceso se quedaba colgado de forma indefinida tras la compilación de bundles (`Application bundle generation complete`), a la espera de interacciones manuales por estar en modo *watch*.
  - El usuario frenó la ejecución y cuestionó la usabilidad:
    > *"No veo que esto avance, se quedó así... ¿esto se explica en el README del front? ¿Se toca algo en el script del package también?"*
- **Análisis de Developer Experience (DX) para Evaluación y CI/CD:**
  - En un proceso de selección o pipeline automatizado de integración continua, un comando `npm test` bloqueante/interactivo es un fallo de usabilidad grave: el evaluador espera que el comando ejecute los tests, devuelva el informe en verde con código de salida 0 y libere la consola limpiamente.
- **Acción correctora ejecutada:**
  1. *Ajuste en `spa-saas-omatic/package.json`:*
     - `"test": "ng test --watch=false"` (pase único predeterminado, determinista y limpio).
     - `"test:watch": "ng test"` (modo desarrollo interactivo con hot-reload para desarrollo continuo).
  2. *Reescritura de `spa-saas-omatic/README.md`:*
     - Se sustituyó el README genérico en inglés por documentación en español explicando la arquitectura, los componentes y los dos modos de ejecución de pruebas.
  3. *Sincronización de `README.md` (raíz) y `architecture-guidelines.md` (Sección 4.2):*
     - Se incorporó la tabla de comandos de pruebas del frontend junto a la del backend.
- **Valor para la evaluación:** Transmite consideración y profesionalidad hacia el evaluador (*Evaluator-First Design*), garantizando cero fricciones en la verificación del proyecto.

### 6.13. Resiliencia Tipográfica: Pila de Fuentes del Sistema (*System Font Fallback Stack*)

- **La observación del Director de Orquesta:**
  - Al revisar `styles.scss`, el usuario reparó en la declaración de fuentes:
    > *"¿Por defecto se usa Roboto? Si falla esa fuente, ¿se ponen alternativas?"*
- **Análisis de resiliencia frontend:**
  - Angular Material utiliza `Roboto` por ser el estándar histórico de Material Design.
  - Sin embargo, confiar ciegamente en una fuente externa de Google Fonts es un fallo de diseño: si la aplicación se ejecuta en una red corporativa sin acceso exterior, en modo offline, en un contenedor Docker aislado o si el CDN de Google Fonts tarda en responder, el navegador salta a la fuente genérica del sistema operativo (que en muchos navegadores es una fuente con serifa anticuada como Times New Roman).
- **Acción correctora ejecutada:**
  1. *Pila de fuentes robusta en `styles.scss`:*  
     Se configuró un *system font fallback stack* moderno:  
     `font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;`  
     Garantiza tipografías sans-serif nítidas y nativas según el sistema operativo: San Francisco en Apple (`-apple-system`), Segoe UI en Windows y sans-serif limpio en Linux/Android.
  2. *Higiene en `index.html`:*  
     Se eliminaron los enlaces redundantes duplicados que `ng add` había introducido dos veces.
- **Valor para la evaluación:** Evita degradación visual en entornos sin conexión y demuestra buenas prácticas de CSS defensivo.

### 6.14. Code Review del Pipe de Divisas: Detección de Code Smell (`switch` vs. Diccionario `const`) y Fuente Única de Verdad

- **Las observaciones del Director de Orquesta:**
  1. **Error de resolución de módulos:**
     > *"Cannot find module '../../core/services/currency.service' or its corresponding type declarations.ts(2307)"*
  2. **Refactorización a Clean Code:**
     > *"¿Y por otro esto está bien? `private getSymbol(code: CurrencyCode): string { switch(code) { case 'EUR': ... } }` ¿no se llevaría a un const map o me estoy liando yo?"*
- **Análisis técnico y pedagógico:**
  - **Diagnóstico del error de import:** El fichero se había guardado accidentalmente en una ruta recursiva duplicada (`src/app/shared/pipes/spa-saas-omatic/src/app/shared/pipes/localized-currency.pipe.ts`). Dos niveles hacia arriba (`../../`) resolvían a una ruta inexistente. En la ubicación canónica (`src/app/shared/pipes/localized-currency.pipe.ts`), la resolución relativa es directa e inmediata.
  - **Validación del criterio de diseño:** El usuario tenía toda la razón. Un bloque imperativo `switch` con 8 ramas para mapear códigos de moneda a símbolos es un *code smell* clásico (verboso, propenso a bifurcaciones innecesarias y viola el principio Abierto/Cerrado).
  - **Optimización arquitectónica (DRY & Single Source of Truth):** En lugar de crear un diccionario aislado sólo para el Pipe, se centralizó `CURRENCY_METADATA` en `currency.model.ts` exportándolo como constante tipada `Record<CurrencyCode, { label: string; symbol: string }>`.
  - De esta forma, tanto `CurrencyService` (para reactividad y opciones de selección) como `LocalizedCurrencyPipe` (para formateo visual O(1) con fallback `CURRENCY_METADATA[code]?.symbol ?? code`) comparten la misma fuente canónica de datos, eliminando 15 líneas de código repetitivo.
- **Valor para la evaluación:** Demuestra capacidad de code review activo, erradicación de antipatrones procedimentales en Angular y aplicación estricta de DRY (*Don't Repeat Yourself*).

### 6.15. Internacionalización Real (i18n): Formateo Nativo con `Intl.NumberFormat` vs. Hardcode de `'es-ES'`

- **La observación crítica del Director de Orquesta:**
  - Al inspeccionar la implementación del pipe de conversión monetaria, el usuario detectó una asunción no documentada en el formateo numérico:
    > *"¿Por qué damos por hecho que el idioma es es? `const formattedAmount = converted.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });`"*
- **Análisis de deficiencias técnicas de hardcodear `'es-ES'`:**
  1. *Incoherencia cultural en divisas anglosajonas:* En países de habla inglesa, el símbolo monetario precede al importe y la puntuación es inversa a la europea (coma para millares y punto para decimales). Forzar `'es-ES'` renderizaba `1.250,50 $` o `1.250,50 £`, lo cual resulta extraño e informal en entornos B2B internacionales frente a `$1,250.50` y `£1,250.50`.
  2. *Error contable en divisas sin decimales (Yen Japonés - JPY):* El Yen no fracciona su moneda en céntimos ni decimales. Forzar `minimumFractionDigits: 2` producía representaciones ficticias como `¥162.500,00` en lugar de la cifra contable real `¥162,500`.
- **Acción correctora y solución arquitectónica aplicada:**
  1. *Enriquecimiento de metadatos en `currency.model.ts`:*  
     Se amplió la interfaz `CurrencyMetadata` para asociar a cada divisa su `locale` y precisión decimal (`decimals`) canónicos:
     ```typescript
     export const CURRENCY_METADATA: Record<CurrencyCode, CurrencyMetadata> = {
       EUR: { label: 'Euro', symbol: '€', locale: 'es-ES', decimals: 2 },
       USD: { label: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2 },
       GBP: { label: 'British Pound', symbol: '£', locale: 'en-GB', decimals: 2 },
       CHF: { label: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH', decimals: 2 },
       CAD: { label: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA', decimals: 2 },
       JPY: { label: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', decimals: 0 },
     };
     ```
  2. *Refactorización de `LocalizedCurrencyPipe` con `Intl.NumberFormat`:*  
     Se eliminaron las concatenaciones manuales `${formattedAmount} ${symbol}` y se delegó en la API estándar W3C/ECMAScript:
     ```typescript
     return new Intl.NumberFormat(meta.locale, {
       style: 'currency',
       currency,
       minimumFractionDigits: meta.decimals,
       maximumFractionDigits: meta.decimals,
     }).format(converted);
     ```
  3. *Verificación automatizada en `localized-currency.pipe.spec.ts`:*  
     Se añadieron casos de prueba específicos comprobando que `EUR` formatea con `1.250,50 €`, `USD` con `$108.00`, `GBP` con `£85.00` y `JPY` con `¥16,250` (sin punto ni decimales).
- **Valor para la evaluación:** Transforma una utilidad cosmética básica en un motor de internacionalización riguroso y profesional, alineado con las mejores prácticas globales de SaaS multi-divisa.

### 6.16. Omisión de Variables de Entorno (`.env` / `.env.example`) y Configuración Multi-entorno: El Director de Orquesta Detecta la Inercia de la IA

- **La observación crítica del Director de Orquesta:**
  - En una revisión global de la configuración del proyecto, el usuario frenó el flujo y lanzó una pregunta directa sobre la gestión de entornos:
    > *"Venga una cosilla: ¿tanto en API como en Front estamos usando `.env`? [...] Crea los `.env` que necesites y eso hay que reflejarlo en los READMEs además de en los MDs correspondientes, que esto no lo vio venir el desarrollo con IA."*
- **Análisis de la omisión y riesgos operacionales (12-Factor App):**
  1. *El sesgo de inercia de la IA:* La IA asumió que, al tener expresiones como `process.env.PORT ?? 3000` y `process.env.DATABASE_NAME || 'saas_o_matic.sqlite'`, la configuración ya estaba resuelta, omitiendo por completo materializar los archivos físicos `.env` y `.env.example`.
  2. *Impacto en la experiencia del evaluador / DevOps:* Un evaluador o ingeniero que clona el repositorio sin un `.env.example` se ve forzado a explorar el código fuente TypeScript para descubrir qué variables se leen, aumentando la fricción de puesta en marcha.
  3. *Diferencias arquitectónicas cliente vs. servidor:* En el backend NestJS (Node.js), las variables de entorno se leen del sistema; pero en el frontend Angular (SPA compilada para el navegador), no existe `process.env`, requiriendo desacoplamiento mediante `src/environments/` (`environment.ts` vs `environment.development.ts` con reemplazo en tiempo de compilación).
- **Acción correctora integral ejecutada:**
  1. *Backend (`mic-saas-omatic`):*
     - Creación de `.env.example` versionado y `.env` para desarrollo local con `PORT`, `DATABASE_NAME` y `NODE_ENV`.
     - Activación de carga nativa en `main.ts` mediante `process.loadEnvFile()` (estándar en Node.js 20.6+ sin añadir dependencias pesadas de terceros).
  2. *Frontend (`spa-saas-omatic`):*
     - Creación de `src/environments/environment.development.ts` (desarrollo local) y `environment.ts` (producción).
     - Configuración de `fileReplacements` en `angular.json` para sustitución automática en compilaciones de desarrollo vs. producción.
  3. *Raíz del Repositorio:*
     - Creación de `.env.example` unificado para la futura orquestación con Docker Compose (`BACKEND_PORT`, `FRONTEND_PORT`, `DATABASE_NAME`, `CURRENCY_API_URL`).
  4. *Documentación Sincronizada:*
     - Actualización de `mic-saas-omatic/README.md` (tabla de variables de entorno).
     - Actualización de `spa-saas-omatic/README.md` (tabla de propiedades de entorno).
     - Actualización de `README.md` (raíz) y `architecture-guidelines.md` (Sección 2.4).
- **Valor para la evaluación:** Demuestra de manera fehaciente que el desarrollador no delega a ciegas en la IA, sino que ejerce un liderazgo técnico activo, garantizando buenas prácticas de configuración desacoplada y facilitando una experiencia de evaluación limpia y sin sorpresas.

### 6.17. Diseño de Escalabilidad de Divisas: Catálogo Controlado (UX Whitelist) vs. Fallback Universal con `Intl`

- **La consulta arquitectónica del Director de Orquesta:**
  - El usuario cuestionó la escalabilidad y origen de las divisas:
    > *"Dudas: usamos estas divisas... pero si en el futuro hay más nuevas, ¿eso se saca de la API externa que te dije o qué? [...] ¿Puedes explicarlo muy brevemente en el MD que toque?"*
- **Análisis de arquitectura y experiencia de usuario:**
  - La API externa `https://open.er-api.com/v6/latest/EUR` suministra en vivo más de 160 tasas de cambio mundiales, las cuales `CurrencyService` almacena de forma íntegra en memoria (`rates`).
  - No obstante, volcar 160 monedas en el selector generaría una interfaz inmanejable para los comerciales de Roams. Por diseño de producto, se definió un catálogo acotado (`SUPPORTED_CURRENCIES` con EUR, USD, GBP, CHF, CAD y JPY).
  - Para asegurar el **Principio Abierto/Cerrado (OCP)**, el pipe `LocalizedCurrencyPipe` se diseñó con un fallback elástico: si se pasa una divisa ISO-4217 no registrada explícitamente en `CURRENCY_METADATA` (ej. `AUD`), el motor nativo `Intl.NumberFormat` del navegador infiere el símbolo, orden y decimales sin necesidad de tocar código.
- **Acción correctora ejecutada:**
  - Se formalizó la estrategia de divisas en `architecture-guidelines.md` (Sección 3.3).
  - Se flexibilizó el acceso a metadatos en `LocalizedCurrencyPipe` (`meta?.locale`, `meta?.decimals`).
  - Se añadió un test unitario en `localized-currency.pipe.spec.ts` verificando el formateo automático de divisas no registradas (`AUD`).
- **Valor para la evaluación:** Refleja madurez arquitectónica, separando claramente las responsabilidades de datos (160+ tasas de la API), producto (catálogo relevante para ventas) y presentación elástica (fallback W3C Intl).

### 6.18. Verificación de Estándares Modernos en Plantillas: Flujo de Control Nativo (`@for`, `@if`) frente a Directivas Estructurales Legacy (`*ngFor`, `*ngIf`)

- **La consulta técnica del Director de Orquesta:**
  - Tras revisar el template de `currency-selector.component.html`, el usuario auditó la sintaxis utilizada:
    > *"¿Se usan los nuevos ngFor y todo eso de las últimas versiones de Angular?"*
- **Análisis de modernización y rendimiento en Angular 22:**
  1. *Obsolescencia de directivas estructurales:* En versiones históricas (Angular 2 a 16), el renderizado condicional e iterativo requería directivas con asterisco (`*ngIf`, `*ngFor`, `*ngSwitch`), las cuales exigían importar `CommonModule` en cada componente Standalone, aumentando el overhead del bundle.
  2. *Optimización del DOM mediante `track`:* En el legacy `*ngFor`, la función `trackBy` era opcional. Su omisión (muy habitual) provocaba que Angular destruyera y recreara la totalidad de los nodos del DOM ante cualquier cambio de estado. En el nuevo `@for`, la cláusula `track` (ej. `track option.code`) es **obligatoria por compilador**, garantizando reconciliación óptima del DOM a 60 FPS.
  3. *Sinergia nativa con Signals:* El nuevo control flow permite evaluar directamente las funciones de señales reactivas (`@if (loading())`, `@for (opt of options())`) sin requerir pipes `async` ni suscripciones manuales en el template.
- **Acción correctora y directriz institucional:**
  - Se confirmó y blindó la adopción estricta del *Built-in Control Flow* (`@if`, `@else if`, `@else`, `@for`, `@empty`) en todos los componentes del frontend de SaaS-O-Matic.
  - Se registró como regla no negociable en `architecture-guidelines.md` (Sección 3.1).
- **Valor para la evaluación:** Demuestra ante el equipo técnico de Roams que el código está escrito conforme al estado del arte contemporáneo de Angular 22, desterrando inercias o patrones obsoletos.

### 6.19. Detección de Strings en Español Hardcodeados: Creación de `I18nService` Reactivo con Signals

- **La queja técnica y corrección del Director de Orquesta:**
  - Al revisar los textos del tooltip del selector de divisa, el usuario frenó en seco la implementación:
    > *"Esto en español es muy cutre. Yo te diría usar i18n o algo así pero dejándolo en esp por defecto u obtenerlo del navegador, ¿o qué me recomiendas?"*
- **Análisis del Code Smell y desacoplamiento de UI:**
  - Hardcodear cadenas literales en español directamente en métodos de TypeScript (`return 'Actualizando tipos de cambio en vivo...';`) es un antipatrón de diseño: ensucia la lógica con presentación, dificulta el testing y viola la regla de coherencia institucional ("código TypeScript en inglés, textos de interfaz centralizados y localizables").
  - Si un evaluador técnico o usuario abre la aplicación en un entorno internacional, se encuentra con textos fijos en español sin opción de traducción.
- **Acción correctora integral ejecutada:**
  1. *Diccionario tipado en `src/app/core/i18n/translations.ts`:*  
     Creación de catálogo bilingüe (`es` y `en`) fuertemente tipado mediante TypeScript (`TranslationKey = keyof typeof TRANSLATIONS.es`).
  2. *Servicio reactivo con Signals: `I18nService` (`src/app/core/services/i18n.service.ts`):*  
     Detecta automáticamente la preferencia del navegador (`navigator.language`) con fallback por defecto al español (`'es'`). Expone el estado como Signal `currentLanguage` y provee el método `t(key: TranslationKey): string`.
  3. *Refactorización en `CurrencySelectorComponent`:*  
     Se eliminaron todos los textos en español del archivo `.ts`; los tooltips y etiquetas de accesibilidad (`aria-label`) ahora consumen `this.i18n.t('currency.sync.loading')`, `this.i18n.t('currency.sync.error')`, etc.
  4. *Pruebas unitarias completas:*  
     Creación de `i18n.service.spec.ts` y actualización de `currency-selector.component.spec.ts` verificando la alternancia reactiva entre español e inglés.
- **Valor para la evaluación:** Eleva la madurez del software a nivel enterprise, erradicando cadenas sueltas y dotando a la SPA de un motor de localización ligero, reactivo y sin dependencias externas pesadas.

### 6.20. Detección de API Deprecada en Tests: Eliminación de `provideNoopAnimations` en Angular 22

- **El error de inercia de la IA:** La IA incluyó `provideNoopAnimations()` del paquete `@angular/platform-browser/animations` en la configuración de `TestBed` de `currency-selector.component.spec.ts`, siguiendo la inercia histórica de pruebas con Angular Material.
- **Detección del warning por el Director de Orquesta:**
  - El usuario auditó el fichero de test y detectó de inmediato el aviso del compilador:
    > *"Arregla y documenta en el MD: The signature '(): Provider[]' of 'provideNoopAnimations' is deprecated.ts(6387)..."*
- **Análisis de la deprecación en Angular 20.2 / 21 / 22:**
  - En Angular moderno, el subsistema `@angular/animations` y `@angular/platform-browser/animations` ha sido formalmente deprecado para su eliminación definitiva en Angular 23.
  - Angular Material 3 ha migrado por completo a animaciones basadas en CSS nativo y la Web Animations API del navegador.
  - En consecuencia, los componentes de Material ya no requieren mockear ni deshabilitar animaciones en tests mediante `provideNoopAnimations()`. Su inclusión solo generaba ruido en consola (`ts(6387)`) y deuda técnica innecesaria.
- **Acción correctora ejecutada:**
  - Se eliminó el import y el provider de `provideNoopAnimations` en `currency-selector.component.spec.ts`.
  - Los tests unitarios continúan ejecutándose con total limpieza y cero advertencias de compilación.
- **Valor para la evaluación:** Muestra un estándar de código sin advertencias (*Zero-Warning Policy*), alineado con las mejores versiones del ecosistema Angular.

### 6.21. Control de Peticiones Asíncronas de Constructor: Gestión de Ciclo de Vida HTTP en Tests de Componentes

- **El fallo detectado en la suite de pruebas:**
  - Al ejecutar `npm test`, el test de `CurrencySelectorComponent > should compute localized status tooltip using I18nService` falló con la aserción:
    ```text
    Expected: "Tipos de cambio actualizados en vivo vía open.er-api.com"
    Received: "Actualizando tipos de cambio en vivo..."
    ```
- **Diagnóstico técnico y causa raíz:**
  - El servicio `CurrencyService` dispara automáticamente la descarga de tipos de cambio (`fetchRates()`) desde su constructor para tener datos frescos al instanciarse.
  - Al instanciar el componente en `TestBed`, la petición HTTP hacia `https://open.er-api.com/v6/latest/EUR` quedaba en vuelo sin resolver por `HttpTestingController`.
  - Como resultado, la señal reactiva `currencyService.loading()` permanecía en `true`, por lo que el componente calculaba fielmente el estado de carga en vez del estado sincronizado.
- **Acción correctora ejecutada:**
  1. *Resolución de ciclo de vida HTTP en `currency-selector.component.spec.ts`:*  
     Se inyectó `HttpTestingController` en el `beforeEach` para capturar y resolver de inmediato la llamada inicial del constructor (`req.flush({ result: 'success', rates: { EUR: 1, USD: 1.08 } })`).
  2. *Aseguramiento de estanqueidad:*  
     Se añadió `httpTesting.verify()` en `afterEach` para garantizar que no queden peticiones HTTP zombis o pendientes entre ejecuciones.
- **Valor para la evaluación:** Demuestra destreza senior en el control del ciclo de vida asíncrono y de Testing de Angular con Signals y `provideHttpClientTesting`, erradicando *flaky tests* o aserciones fallidas por condiciones de carrera.

### 6.22. Erradicación de Colores Hardcodeados en Componentes: Sistema de Design Tokens Corporativos Roams en CSS Cascade

- **La queja y corrección del Director de Orquesta:**
  - Al revisar los estilos de los componentes, el usuario frenó la mala praxis de la IA al dispersar colores hexadecimales en cada archivo:
    > *"Esto es un horror, los colores en variables de estilos para los colores por ejemplo, y que bajen en cascada o algo así desde SCSS superiores porque la mayoría son colores corporativos, ¿no? Esta es la página de la empresa https://roams.es/ para hacerte una idea más o menos de los colores..."*
- **Análisis del Anti-patrón de CSS:**
  - Dispersar valores hexadecimales (`#10b981`, `#38bdf8`, `#f59e0b`, `#ffffff`, `#64748b`) en las hojas de estilo de cada componente particular genera acoplamiento rígido, duplicidad y dificulta el mantenimiento o la adaptación de marca corporativa.
  - La práctica senior consiste en definir un sistema de **Design Tokens** mediante variables CSS Custom Properties (`--roams-*`) en la raíz (`:root`), permitiendo que la cascada nativa de CSS las propague de forma automática a todos los componentes hijos (incluyendo componentes encapsulados de Angular) sin necesidad de importar archivos en cada `.scss`.
- **Acción correctora ejecutada:**
  1. *Modelado de Design Tokens corporativos en `src/styles.scss`:*  
     Inspirado en la paleta corporativa de `roams.es`:
     - Azul marino principal: `--roams-primary: #0F172A`
     - Azul corporativo Roams: `--roams-accent-blue: #1061E2`
     - Acento cian Roams: `--roams-accent-cyan: #0EA5E9`
     - Estados semánticos: `--roams-status-success: #10B981` (verde ahorro/sincronizado), `--roams-status-warning: #F59E0B`, `--roams-status-error: #EF4444`.
     - Superficies y fondos: `--roams-bg-page: #F8FAFC`, `--roams-bg-card: #FFFFFF`.
     - Geometría de diseño: `--roams-radius-lg: 16px` (radio de tarjetas redondeadas de Roams).
  2. *Refactorización limpia de `currency-selector.component.scss`:*  
     Se eliminaron todos los valores hexadecimales literales, sustituyéndolos por `var(--roams-status-success)`, `var(--roams-bg-input-dark)`, `var(--roams-text-inverse)`, etc.
- **Valor para la evaluación:** Demuestra excelencia en arquitectura frontend (Design Tokens, CSS Cascade, Single Source of Truth visual) y un compromiso fiel con la identidad de marca del evaluador (Roams).

### 6.23. Higiene de Salida en Testing (Zero-Stderr Policy): Espiado de `console.warn` en Tests de Resiliencia y Validación del Contrato Real

- **La observación del Director de Orquesta:**
  - Al revisar los logs de ejecución de `npm test`, el usuario advirtió una salida voluminosa en stderr:
    > *"¿Este tipo de error está bien? `stderr | CurrencyService > should retain fallback rates and set error signal on network failure Currency API unreachable, using resilient fallback rates: HttpErrorResponse { status: 0, statusText: 'Network Error' ... }` Y por otro lado, ¿comprobaste todos los SCSS? Esto devuelve la API `https://open.er-api.com/v6/latest/EUR`: `{ result: 'success', rates: { ... } }`"*
- **Análisis de Developer Experience (DX) y Calidad de Pruebas:**
  1. *El origen del stderr:* La prueba unitaria de fallo de red simula de forma intencionada una caída (`status: 0`) para probar la activación de los tipos de cambio de contingencia en caché. Sin embargo, el método ejecutaba `console.warn(...)`, lo que provocaba que Vitest volcase todo el objeto `HttpErrorResponse` a la consola de stderr, generando confusión e incertidumbre para el evaluador.
  2. *Higiene en suites de test:* Un informe de test profesional debe ejecutarse con una política de "cero ruido" (*Zero-Stderr Policy*): los warnings esperados deben ser interceptados y asertados, impidiendo que ensucien la consola de evaluación o de CI/CD.
  3. *Validación del contrato real de la API:* Se verificó contra el payload real suministrado por el usuario (`result: "success"`, `base_code: "EUR"`, `time_last_update_utc`, 162 divisas en `rates`), confirmando que la interfaz TypeScript `ExchangeRateApiResponse` encaja con una fidelidad del 100%.
- **Acción correctora ejecutada:**
  1. *Espiado de logs en `currency.service.spec.ts`:*  
     Se aplicó `const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});` durante el test de red, comprobando que se invoca (`expect(warnSpy).toHaveBeenCalled()`) y restaurándolo con `warnSpy.mockRestore()`.
  2. *Auditoría de SCSS:*  
     Se verificó que los tres únicos ficheros SCSS del frontend (`styles.scss`, `currency-selector.component.scss` y `app.scss`) respetan de forma estricta el sistema de tokens `--roams-*` sin valores hexadecimales hardcodeados.
- **Valor para la evaluación:** Proporciona una suite de pruebas determinista, rápida y con una salida de consola completamente limpia y profesional, validada contra los datos reales de la API externa.

### 6.24. Principio de Encapsulación Modular: Aislamiento de Componentes por Feature (`modules/`) vs. Capa Global/Common (`shared/`)

- **La directriz arquitectónica del Director de Orquesta:**
  - Al iniciar la maquetación de componentes, el usuario estableció una frontera estricta de responsabilidades:
    > *"Te explico: quiero que cada módulo tenga sus componentes y SCSS etc., y luego hay componentes globales o common."*
- **Análisis de cohesión y empaquetado por dominio (Domain-Driven Frontend):**
  - En aplicaciones medianas/grandes, un error frecuente de los modelos de IA es arrojar todos los componentes en una carpeta `shared/` o `components/` plana, rompiendo la modularidad y el principio de responsabilidad única.
  - El criterio establecido por el usuario separa nítidamente dos tipos de componentes:
    1. *Componentes de Dominio/Feature:* Los componentes de clientes (`customer-card`, `customer-search-bar`, vistas de listado y detalle) pertenecen y residen exclusivamente en `src/app/modules/customers/`, con sus propios templates, estilos SCSS encapsulados y specs. Lo mismo para `src/app/modules/simulations/` (`simulation-slider`, `simulation-history`).
    2. *Componentes Globales / Transversales:* Únicamente los componentes del marco o shell de la aplicación (`navbar`, `currency-selector`, `error-banner`) que no pertenecen a un módulo de negocio particular residen en la capa compartida (`src/app/shared/components/`).
- **Solución aplicada:** Se consolidó esta regla en `architecture-guidelines.md` (Sección 3.1) y se estructuró la Navbar como componente transversal de shell en `src/app/shared/components/navbar/`.
- **Valor para la evaluación:** Demuestra disciplina en modularidad, alta cohesión interna y bajo acoplamiento entreBounded Contexts.

### 6.25. Diagnóstico de Ciclo de Instanciación en DI de Angular: Resolución de Orden en Mocks de `HttpTestingController`

- **El fallo detectado en la suite de pruebas:**
  - Al ejecutar `npm test`, los tests de `navbar.component.spec.ts` y `app.spec.ts` fallaron con el error:
    ```text
    Error: Expected one matching request for criteria "Match URL: https://open.er-api.com/v6/latest/EUR", found none.
    ```
- **Diagnóstico técnico y causa raíz (Lazy Instantiation en Angular DI):**
  - Los servicios en el inyector de dependencias de Angular se instancian de forma perezosa (*lazy*): no se ejecutan sus constructores hasta que una clase dependiente los inyecta de forma activa.
  - La IA colocó la intercepción HTTP `httpTesting.expectOne(...)` en el bloque `beforeEach` **antes** de invocar `TestBed.createComponent(...)`.
  - Dado que ni `NavbarComponent` ni `App` habían sido creados todavía en el DOM virtual de pruebas, el componente hijo `CurrencySelectorComponent` aún no existía y, por ende, `CurrencyService` todavía no se había instanciado ni había emitido su petición HTTP a la API externa.
- **Acción correctora ejecutada:**
  - Se reordenó la inicialización en ambos specs: primero se crea la instancia del componente (`TestBed.createComponent`), lo que desencadena la instanciación de los hijos y la emisión de la llamada HTTP; inmediatamente después se intercepta con `httpTesting.expectOne(...)` y se resuelve con `req.flush(...)`.
- **Valor para la evaluación:** Demuestra dominio riguroso del ciclo de vida de componentes anidados y del inyector de dependencias en pruebas unitarias de Angular con `provideHttpClientTesting`.

### 6.26. Diagnóstico del Servidor de Desarrollo Vite (`ng serve`) y Resolución de `ERR_CONNECTION_REFUSED`

- **La incidencia reportada:**
  - Al ejecutar `npm start` en el frontend, la terminal mostró:
    ```text
    Initial chunk files | Names         | Raw size
    main.js             | main          | 34.66 kB | 
    styles.css          | styles        |  9.85 kB | 
                        | Initial total | 44.51 kB
    Application bundle generation complete. [0.877 seconds] - 2026-11-13T13:58:21.053Z
    ```
  - Al abrir el navegador en `http://localhost:4200`, Chrome devolvió el error:
    `ERR_CONNECTION_REFUSED (localhost refused to connect)`.
  - El usuario indicó: *"no levanta, solo hace build... no lo abre"*.
- **Diagnóstico técnico y causa raíz:**
  1. *Comportamiento de `@angular/build:dev-server` con Vite:* En Angular moderno, el servidor de desarrollo se basa en Vite/esbuild. Tras compilar los bundles iniciales en memoria en menos de 1 segundo (`0.877s`), emite `Application bundle generation complete` y **permanece activo en primer plano escuchando conexiones HTTP entrantes y vigilando cambios de código (HMR)**.
  2. *Causa de la desconexión:* Si el desarrollador pulsa `Ctrl + C` o cierra el proceso pensando que era una compilación estática por lotes (`ng build`), el servidor de desarrollo Vite finaliza de inmediato. Cuando el navegador intenta conectar a `localhost:4200`, el socket no responde y el kernel de Linux rechaza la conexión con `ECONNREFUSED`.
  3. *Ausencia de apertura automática:* Por defecto, `ng serve` no lanza el navegador web a menos que se le añada la opción `--open`.
- **Acción correctora ejecutada:**
  1. Se actualizó el script `"start": "ng serve --open"` en `spa-saas-omatic/package.json` para que lance automáticamente Google Chrome en el puerto correspondiente en cuanto finaliza el bundle inicial.
  2. Se instruyó al usuario sobre la naturaleza continua del servidor de desarrollo (debe permanecer abierto en una pestaña de terminal) y se verificó la accesibilidad en `http://localhost:4200` y `http://127.0.0.1:4200`.
- **Valor para la evaluación:** Claridad operativa sobre la infraestructura de desarrollo moderna de Angular/Vite y resolución guiada de incidencias en entorno local.

### 6.27. Refactorización Proactiva de Estilos: Desacoplamiento de Tokens en Parcial Modular `_colors.scss` (Patrón 7-1)

- **La intervención estratégica del Director de Orquesta:**
  - Tras la unificación de tokens corporativos en `styles.scss`, el usuario planteó una mejora arquitectónica de diseño modular:
    > *"Vale, lo último que revisamos: el tema de los colores en SCSS, ¿eso no va mejor aún en un `_colors.scss`?"*
- **Análisis arquitectónico (Patrón 7-1 / ITCSS / Modular SCSS):**
  1. *El anti-patrón del archivo monolítico:* Mantener variables SCSS, reglas CSS de `:root`, mixins globales y reglas de reseteo en un único archivo `styles.scss` monolítico viola el principio de responsabilidad única (SRP) y entorpece la escalabilidad a medida que el sistema de diseño crece.
  2. *Uso de parciales (`_*.scss`):* En Dart Sass moderno, los archivos prefijados con guion bajo (`_colors.scss`, `_variables.scss`) son parciales (*partials*): no generan artefactos CSS independientes en tiempo de compilación, sino que se integran mediante `@use` manteniendo el espacio de nombres limpio y evitando duplicación de código.
  3. *Inclusión de rutas en preprocesador (`angular.json`):* Configurar `stylePreprocessorOptions.includePaths: ["src/styles"]` en la configuración de compilación de Angular permite a cualquier componente desacoplado importar `@use 'colors'` directamente, eliminando rutas relativas quebradizas como `../../styles/_colors.scss`.
- **Acción ejecutada:**
  1. Se creó `src/styles/_colors.scss` conteniendo las variables SCSS compile-time (`$roams-*`) y su proyección a CSS Custom Properties runtime (`--roams-*` en `:root`).
  2. Se creó `src/styles/_variables.scss` conteniendo la geometría de bordes (`--roams-radius-*`) y las matrices de sombra (`--roams-shadow-*`).
  3. Se limpió `src/styles.scss`, quedando exclusivamente como orquestador raíz mediante `@use './styles/colors'` y `@use './styles/variables'`.
  4. Se añadió `stylePreprocessorOptions` en `spa-saas-omatic/angular.json`.
- **Valor para la evaluación:** Refleja maestría en arquitectura frontend, modularidad según estándares de Sass/Angular y la capacidad del Director de Orquesta de elevar la calidad del código mediante refactorizaciones estructurales limpias.

### 6.28. Implementación del Componente de Feedback y Resiliencia `ErrorBannerComponent` (RFC 7807)

- **El requerimiento funcional y de resiliencia:**
  - El frontend requería un componente visual transversal para mostrar errores de forma estructurada según la especificación RFC 7807 (`application/problem+json`) emitida por el backend NestJS o el interceptor de red.
- **Criterios de diseño y accesibilidad:**
  1. *Arquitectura Standalone con Signals:* Empleo de `input<ProblemDetail | null>(null)`, `input<boolean>(true)` y `output<void>()` de Angular 22, sin decoradores obsoletos (`@Input`, `@Output`).
  2. *Accesibilidad (a11y):* Marcado semántico con `role="alert"` y `aria-live="assertive"`, permitiendo a lectores de pantalla vocalizar los fallos inmediatamente.
  3. *Visualización de Validación Estructurada:* Renderizado condicional mediante `@if (p.invalidParams?.length)` con una tabla estilizada de parámetros no válidos (`name` y `reason`) usando tokens `--roams-*`.
  4. *Internacionalización reactiva:* Conexión directa con `I18nService` para los encabezados y etiquetas de accesibilidad en español e inglés.
- **Acción ejecutada:**
  - Se crearon los 4 ficheros en `src/app/shared/components/error-banner/` (`error-banner.component.ts`, `.html`, `.scss`, `.spec.ts`).
  - Se añadieron 7 pruebas unitarias cubriendo renderizado nulo, presentación de código HTTP, detalle, desglose de parámetros no válidos, evento de descarte y cambio dinámico de idioma.
- **Valor para la evaluación:** Coherencia de diseño de extremo a extremo (Backend RFC 7807 -> Interceptor -> Banner UI accesible) y tolerancia a fallos contrastada con cobertura exhaustiva.

### 6.29. Erradicación de Boilerplate Redundante: Adopción Estricta de `standalone: true` por Defecto (Angular 19/22)

- **La observación crítica del Director de Orquesta:**
  - Al revisar los metadatos de `@Component` en los componentes creados, el usuario cuestionó una inercia de código generada por la IA:
    > *"¿Hace falta poner esto? ¿No es `standalone` a `true` por defecto? ¿O me confundo: `standalone: true`?"*
- **Análisis de evolución del framework (Angular 14-18 vs. Angular 19+):**
  1. *El origen de la inercia:* En Angular 14 a 18, los Standalone Components eran opcionales (*opt-in*), por lo que era mandatorio declarar `standalone: true` en `@Component`, `@Directive` y `@Pipe`.
  2. *El nuevo estándar en Angular 19 y 22:* A partir de Angular 19, el equipo de Google Angular invirtió el comportamiento por defecto: **todos los componentes, directivas y pipes son standalone de forma predeterminada**. Declarar `standalone: true` es código redundante (*dead boilerplate*); únicamente si se requiriera vincular un componente a un `NgModule` legacy se declararía `standalone: false`.
  3. *Higiene y concisión:* Un código senior para Angular 22 no debe arrastrar residuos sintácticos de versiones anteriores.
- **Acción correctora ejecutada:**
  - Se eliminó `standalone: true` de todos los componentes y pipes de la aplicación (`ErrorBannerComponent`, `NavbarComponent`, `CurrencySelectorComponent`, `App`, `LocalizedCurrencyPipe`).
  - Se incorporó la directriz en las pautas arquitectónicas (`architecture-guidelines.md`, Sección 3.6).
- **Valor para la evaluación:** Demuestra conocimiento profundo y actualizado de las últimas versiones de Angular (v19/v22) y la capacidad del Director de Orquesta para depurar malas costumbres e inercias sintácticas de los modelos de IA.

### 6.30. Validación y Coherencia de URIs en RFC 7807: Uso Canónico de `about:blank` y Dominio del Sistema

- **La consulta técnica del Director de Orquesta:**
  - El usuario auditó el valor asignado al campo `type` en el mock de pruebas y en el interceptor, preguntando si el uso de `about:blank` para errores genéricos era canónico y correcto según la especificación.
- **Análisis de la especificación RFC 7807 (Sección 3.1 y Sección 4.2):**
  1. *El propósito de `about:blank`:* La RFC 7807 explicita que cuando un problema HTTP no cuenta con una URI documental específica o ocurre fuera del servidor (ej. fallo de red, timeout), el valor del miembro `type` debe ser `about:blank`. Esto formaliza que el fallo no tiene semántica extendida más allá del código HTTP.
  2. *Coherencia en suites de prueba:* En lugar de usar la URL teórica del borrador del IETF (`https://tools.ietf.org/html/rfc7231#section-6.5.1`), se homogeneizó el `mockProblem` en `error-banner.component.spec.ts` para utilizar el patrón real emitido por el filtro del backend NestJS (`https://errors.saas-o-matic.com/400`).
- **Acción ejecutada:**
  - Se sustituyó la URI teórica en el mock del spec por la URL de dominio corporativo del microservicio (`https://errors.saas-o-matic.com/400`), manteniendo `about:blank` en los casos de contingencia de red del interceptor.
- **Valor para la evaluación:** Alineación y coherencia estricta entre el contrato backend (`ProblemDetailExceptionFilter`), el cliente HTTP frontend (`error.interceptor.ts`) y los mocks de testing unitario.

### 6.31. Implementación del Módulo de Clientes (`modules/customers/`): Buscador Reactivo con Debounce, Tarjeta Corporativa y Smart Page con Lazy Loading

- **El requerimiento funcional:**
  - Construir la feature completa del Bounded Context de Clientes en el frontend, permitiendo al equipo comercial buscar en tiempo real clientes por nombre, CIF/NIF o email, visualizar su información con la identidad visual de Roams y navegar hacia la simulación.
- **Decisiones arquitectónicas de diseño y rendimiento:**
  1. *Buscador Reactivo Desacoplado (`CustomerSearchBarComponent`):*  
     Implementado mediante un `Subject<string>` con operadores RxJS `debounceTime(300)` y `distinctUntilChanged()`. Esto evita saturar el backend con peticiones HTTP por cada pulsación de tecla y previene búsquedas redundantes si el término no varía. Incluye botón de reseteo rápido (`clear()`).
  2. *Tarjeta Dumb Component (`CustomerCardComponent`):*  
     Geometría con radio de curvatura corporativo `--roams-radius-lg: 16px`, elevación en hover `--roams-shadow-md`, avatar con inicial de empresa sobre gradiente Roams, cálculo dinámico de banderas emoji mediante puntos de código Unicode (`ES -> 🇪🇸`, `US -> 🇺🇸`) y botón de acción directa hacia la simulación con navegación nativa `routerLink`.
  3. *Smart Page con Estados de Ciclo de Vida (`CustomerListComponent`):*  
     Conexión directa con `CustomerApiService`, renderizado del componente transversal `ErrorBannerComponent` ante fallos de servidor, contador reactivo de clientes encontrados, estado de carga accesible con `mat-spinner` y estado vacío (*empty state*) amigable con botón para restablecer filtros.
  4. *Enrutamiento Modular con Lazy Loading:*  
     Configuración en `app.routes.ts` con carga perezosa (`loadComponent`) para optimizar el bundle inicial y redirección de ruta raíz (`'' -> 'customers'`).
- **Acción ejecutada:**
  - Se implementaron los 3 componentes con sus estilos SCSS desacoplados basados en tokens y sus suites de pruebas unitarias (17 tests nuevos entre los 3 componentes).
  - La suite del frontend se eleva a **78 pruebas unitarias 100% en verde**.
- **Valor para la evaluación:** Excelencia en arquitectura Angular (Dumb vs. Smart components, reactividad controlada con debounce, accesibilidad y diseño visual fiel a Roams).

### 6.32. Refactorización a Pipe Declarativo de Internacionalización (`TranslatePipe`): Erradicación de Invocación de Métodos en Plantillas

- **La observación arquitectónica del Director de Orquesta:**
  - Al revisar las plantillas HTML generadas por la IA, el usuario detectó una mala práctica recurrente de desarrollo:
    > *"¿Esto no es mejor con un pipe de traducción? ¿O se hace así en Angular 22: `<span>{{ i18n.t('customers.card.simulate.btn') }}</span>`?"*
- **Análisis de calidad de código y buenas prácticas en Angular:**
  1. *El anti-patrón de invocar métodos en interpolación:* Inyectar `I18nService` en clases TypeScript exclusivamente para invocar `i18n.t(...)` dentro de las plantillas contamina los componentes desacoplados (*Dumb Components*), forzando dependencias innecesarias en sus constructores/inyecciones y violando el principio de responsabilidad única.
  2. *El estándar idiomático de Angular:* El ecosistema de Angular (desde *ngx-translate* hasta *Transloco* y las directivas oficiales) prescribe el uso de **Pipes** (`| translate`). Los pipes permiten una sintaxis puramente declarativa en el HTML (`{{ 'clave' | translate }}`), desacoplando la plantilla de la lógica de TypeScript del componente.
  3. *Reactividad ante cambio de idioma:* Al configurar el pipe con `pure: false`, Angular reevalúa automáticamente las cadenas traducidas en cuanto la Signal `currentLanguage` de `I18nService` conmuta, sin necesidad de recargar la página ni re-renderizar componentes manualmente.
- **Acción ejecutada:**
  - Se creó el pipe transversal `TranslatePipe` en `src/app/shared/pipes/translate.pipe.ts` con su suite de pruebas unitarias exhaustiva (4 tests).
  - Se refactorizaron todos los componentes (`CustomerCardComponent`, `CustomerSearchBarComponent`, `CustomerListComponent`, `ErrorBannerComponent`, `NavbarComponent`, `CurrencySelectorComponent`) eliminando la inyección innecesaria de `I18nService` en sus clases e implementando la sintaxis declarativa `| translate`.
  - La suite de pruebas del frontend se amplía a **82 tests unitarios 100% en verde**.
- **Valor para la evaluación:** Demuestra criterio senior de arquitectura frontend, eliminación de código spaguetti en plantillas y adopción de los patrones de diseño más limpios de Angular.


























