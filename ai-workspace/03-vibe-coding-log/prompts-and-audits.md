# Bitácora de Desarrollo con IA (Vibe Coding Log)
**Proyecto:** SaaS-O-Matic (Dynamic Billing & Subscription Optimizer)  
**Metodología:** Spec-Driven Development + Vibe Coding Auditado  

---

## Entrada 01: Inicialización del Reto y Especificaciones Funcionales

### 1. Prompt Usado (Entrada del Desarrollador)
> "Actúa como Senior Full-Stack Developer (Node.js / NestJS + Angular) y como mi director de orquesta para la prueba técnica de Roams. [...] Objetivo: Construir el proyecto completo paso a paso, sin generar todo de golpe, con criterio Senior, Spec-Driven Development y auditoría constante. [...] Regla clave: Código en inglés, documentación en español."

### 2. Resultado de la IA
- Análisis del enunciado oficial de Roams (`Prueba_Devs_con_IA_1.docx`).
- Confirmación de las reglas de negocio clave:
  - Tarificación por tramos acumulativos: 0-10 a 10€, 11-50 a 8€, >50 a 5€.
  - Validación algorítmica real para España (DNI/NIE módulo 23, CIF con suma de pares e impares y regla de carácter de control).
  - Persistencia de métricas `storageGb` y `apiCalls` a coste 0€.
  - Modelo de error RFC 7807 (`application/problem+json`).
- Redacción inicial del documento en español con atributos técnicos en inglés:  
  Archivo: `ai-workspace/01-specs/functional-specs.md`.

### 3. Auditoría y Corrección del Desarrollador (Criterio Senior)
- **Criterio de Idioma:** Se formaliza la directriz *"Código en inglés, documentación en español"*. Se audita que todas las entidades, atributos, variables y contratos de API mantengan nombres estándar en inglés (`Customer`, `Simulation`, `taxId`, `monthlyBaseCost`), mientras que las explicaciones y reglas de negocio estén en español riguroso.
- **Auditoría de Casos Límite:** Se verifica que la fórmula matemática cubra explícitamente $u=0 \implies 0€$, $u=15 \implies 140€$ y $u=60 \implies 470€$.
- **Aprobación de la Fase 1 (Parte A):** `functional-specs.md` queda establecido como base funcional.

---

## Entrada 02: Contrato Formal de API REST (OpenAPI 3.0)

### 1. Prompt Usado (Entrada del Desarrollador)
> "Vamos al `openapi.yaml` que también va con descripciones en español pero con nombres de campos en inglés."

### 2. Resultado de la IA
- Creación del archivo `ai-workspace/01-specs/openapi.yaml`.
- Definición de endpoints sin prefijo de versión (`/customers`, `/customers/{id}`, `/simulations`).
- Definición de esquemas de datos: `CustomerCreate`, `Customer`, `SimulationCreate`, `Simulation`, `CustomerWithSimulations` y `ProblemDetail`.
- Descripciones completas en español y nombres de campos estandarizados en inglés.

### 3. Auditoría y Corrección del Desarrollador (Criterio Senior)
- **Verificación de Códigos de Estado:** Se comprueba que `POST /customers` contemple `201`, `400` (validación fiscal), `409` (taxId duplicado).
- **Estructura de Errores RFC 7807:** Se valida que todas las respuestas de error utilicen el Content-Type `application/problem+json` y expongan los campos canónicos (`type`, `title`, `status`, `detail`, `instance`, `invalidParams`, `timestamp`).

---

## Entrada 03: Auditoría Cruzada y Refinamiento de Casos Fiscales

### 1. Prompt Usado (Entrada del Desarrollador)
> "que oopinas de lo que dice meta ai? [...] 1. Las letras del CIF te faltan K, L, M [...] 2. El taxId sin guiones/espacios: Se normaliza con trim + mayúsculas + quitar espacios y guiones antes de validar y guardar. 3. taxRate vs taxPercentage: taxRate en decimal, y asegúrate de que en el openapi.yaml pones exactamente el mismo nombre y el mismo formato."

### 2. Resultado de la IA
- Aceptación íntegra de las 3 observaciones de auditoría:
  1. Inclusión de `K, L, M` en los tipos de CIF (`[ABCDEFGHJKLMNPQRSUVW]`) y adición de `L, M` al grupo de control mixto.
  2. Tratamiento de `taxId`: se explicita como sanitización/normalización previa (`.replace(/[\s-]/g, '').toUpperCase()`) en lugar de rechazo directo.
  3. Verificación de congruencia estricta en `openapi.yaml`: `taxRate: 0.21` (float decimal), `taxAmount`, `totalCost`, `currency: "EUR"`.
- Actualización sincronizada de `functional-specs.md` y `openapi.yaml`.

### 3. Auditoría y Corrección del Desarrollador (Criterio Senior)
- **Robustez en Entrada de Usuario:** Un input resiliente que acepte `b12345678` o `B-12345678` y lo sanee internamente es un estándar de UX indispensable que evita falsos negativos en pruebas automáticas o manuales del evaluador.
- **Exhaustividad AEAT:** La adición de las entidades `K` (menores/incapacitados), `L` (no residentes sin establecimiento permanente) y `M` (extranjeros sin NIE) cubre el espectro completo del Real Decreto 1065/2007.
- **Fase 1 Definitivamente Congelada (v1.0.0).**

---

## Entrada 04: Definición de Arquitectura Hexagonal y Estrategia Git

### 1. Prompt Usado (Entrada del Desarrollador)
> "Sí, íbamos por commits, y es así como hay que hacerlo. [...] 1. Definir antes de codear, solo las specs: functional-specs, openapi.yaml, architecture-guidelines. 2. Codear + documentar en paralelo, por commits pequeños [...] ¿Hacemos ya el 02-architecture/architecture-guidelines.md para cerrar la parte de definir y empezar con el primer commit de código, el del validador?"

### 2. Resultado de la IA
- Generación de `ai-workspace/02-architecture/architecture-guidelines.md`:
  - Modelo de capas Hexagonales (Dominio puro sin decoradores de NestJS ni TypeORM, Aplicación con Casos de Uso, Infraestructura con Adaptadores TypeORM y Controladores NestJS).
  - Arquitectura Frontend en Angular 21 (Standalone Components, reactividad unidireccional con Signals, cálculo de proyección en local antes de persistir).
  - Definición del flujo de Git con commits atómicos por funcionalidad + tests unitarios + registro en bitácora en paralelo.

### 3. Auditoría y Corrección del Desarrollador (Criterio Senior)
- **Validación del Plan de Commits:** Se aprueba no hacer un único commit al final sino reflejar la evolución real del proyecto en el historial de Git, vinculando cada commit a su correspondiente prueba unitaria y entrada de bitácora.
- **Fase 2 Cerrada:** Listos para iniciar la Fase 3 con el primer commit de código: `feat(api): add spanish fiscal validator with strict algorithms and unit tests`.

---

## Entrada 05: Refinamiento de la Estructura Hexagonal (Puertos y Adaptadores)

### 1. Prompt Usado (Entrada del Desarrollador)
> "que opinas de lo que dice meta ai? [...] 1. El customers.module.ts no va dentro de infrastructure/ [...] tiene que estar un nivel arriba, en la raíz del módulo [...] 2. El shared/ no va dentro de modules/ [...] mejor en src/shared/ [...] Fuera de eso, quédate con esa nomenclatura explícita ports/in, ports/out, adapters/in/rest, adapters/out/persistence."

### 2. Resultado de la IA
- Aceptación y ajuste fino inmediato en `architecture-guidelines.md`:
  1. Ubicación de `customers.module.ts` y `simulations.module.ts` en la raíz de su módulo para orquestar explícitamente `domain`, `application` e `infrastructure`.
  2. Ubicación de `shared/` directamente en `src/shared/` para denotar su carácter transversal a toda la aplicación.
  3. Adopción de la nomenclatura explícita de arquitectura hexagonal: `application/ports/in/`, `application/ports/out/`, `infrastructure/adapters/in/rest/`, `infrastructure/adapters/out/persistence/`.

### 3. Auditoría y Corrección del Desarrollador (Criterio Senior)
- **Claridad Arquitectónica Inmediata:** La nomenclatura explícita elimina cualquier ambigüedad ante el evaluador de Roams, evidenciando el patrón de puertos y adaptadores sin forzarlo a descifrar convenciones implícitas.
- **Wiring Limpio de NestJS:** Mantener el `.module.ts` en la raíz del módulo respeta la idiomaticidad de NestJS mientras aísla las capas internas.
- **Luz verde para iniciar la codificación.**

