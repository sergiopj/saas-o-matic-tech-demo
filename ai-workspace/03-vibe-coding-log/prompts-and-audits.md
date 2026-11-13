# Bitácora de Desarrollo con IA y Control de Calidad (Vibe Coding Log)
**Proyecto:** SaaS-O-Matic (Dynamic Billing & Subscription Optimizer)  
**Metodología:** Spec-Driven Development + Vibe Coding Auditado  
**Enfoque de Evaluación:** Criterio Técnico y Rol de Director de Orquesta (25% Roams)  

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





