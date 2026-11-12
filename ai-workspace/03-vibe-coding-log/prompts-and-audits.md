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

