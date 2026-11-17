# 🚀 SaaS-O-Matic — Dynamic Billing & Subscription Optimizer

> **Reto Técnico Roams:** Herramienta interna para que el equipo comercial pueda simular, optimizar y presupuestar suscripciones SaaS multi-divisa para clientes corporativos.

Proyecto construido bajo **Arquitectura Hexagonal (Puertos y Adaptadores)**, metodología **Spec-Driven Development (API-First)** y desarrollo asistido por IA auditado (**Vibe Coding** con control de calidad continuo).

---

## 📁 Estructura del Repositorio

El proyecto sigue una convención corporativa de microservicio y single-page application:

- **`mic-saas-omatic/`**: Microservicio Backend desarrollado con **NestJS 12**, **TypeScript**, **SQLite (`better-sqlite3`)** y persistencia en modo WAL.
- **`spa-saas-omatic/`**: Frontend Dashboard Comercial desarrollado con **Angular 22** (Standalone Components y Signals reactivos).
- **`ai-workspace/`**: Espacio de trabajo y auditoría del proceso de ingeniería con IA (especificaciones, arquitectura y bitácora de vibe coding).

> [!NOTE]
> **🖥️ Recomendación de Visualización (Desktop Optimizado / 100% Responsive):**  
> Al tratarse de una herramienta comercial interna orientada a la analítica de consumo, simulación interactiva de tramos en tiempo real, tablas de histórico denso y composición de propuestas, **se recomienda su uso en pantallas de escritorio (Desktop $\ge$ 1024px)** para maximizar la productividad y ergonomía del comercial. No obstante, la plataforma es **100% responsive** y está completamente adaptada para tablets y móviles (navbar en 2 filas, sidebar colapsable, drawer de filtros táctil y grids fluidos).  
> **Anclaje Visual en Desktop vs. Cero Ruido en Smartphones:** Las ilustraciones 3D *human-centered* aportan un alto valor de anclaje visual cálido para reconocer cada sección de un vistazo en desktop y tablets; en smartphones ($\le$ 768px), estas imágenes tipo banner se ocultan de forma selectiva para erradicar el ruido visual y garantizar que los formularios interactivos y métricas queden visibles *above the fold*.

---

## 📋 Requisitos Previos

Dependiendo de cómo prefiera evaluar el proyecto:

### Opción A (Recomendada / Nativa — Sin Docker):
- **Node.js**: `>= 20.x` o `>= 22.x LTS` (probado y validado en Node v22.14.0+)
- **npm**: `>= 10.x`
- **Git**: Para clonación e inspección del histórico
- *(Cero configuración de bases de datos externas: utiliza SQLite embebido en disco con WAL mode y auto-migración al arrancar)*.

### Opción B (Containerizada con Docker):
- **Docker Desktop** (Windows/macOS) o **Docker Engine + Docker Compose** (Linux) con versión Docker `>= 24.x`.
- El daemon/servicio de Docker Desktop debe estar **iniciado y en ejecución en segundo plano** antes de lanzar `docker compose up`.
- En Windows requiere WSL 2 (Windows Subsystem for Linux) o Hyper-V habilitado.
- *(No requiere tener Node.js ni npm instalados en la máquina anfitriona, todo se compila dentro de los contenedores)*.

---

## ⚡ Puesta en Marcha Rápida (1 Solo Comando — Guía para el Evaluador)

Para maximizar la ergonomía y facilitar al máximo la revisión técnica, el repositorio dispone de un orquestador unificado en la raíz. **No es necesario navegar entre carpetas ni abrir múltiples terminales manualmente.**

### Paso 1: Instalación de Dependencias (1 solo comando en la raíz)

```bash
npm install
```
> **¿Qué hace este comando?** Instala las herramientas de orquestación en la raíz y, de forma transparente mediante el hook `postinstall`, instala automáticamente todas las dependencias del backend (`mic-saas-omatic`) y del frontend (`spa-saas-omatic`) en cascada.

---

### Paso 2: Arranque Simultáneo de API y Frontend (1 solo comando en la raíz)

```bash
npm start
```
*(O también su alias `npm run dev`)*

> **¿Qué hace este comando?** Utiliza `concurrently` para compilar y levantar de manera simultánea ambos servicios en una única consola interactiva con logs diferenciados por colores:
> - 🟦 **`[API]` Backend (NestJS 12):** Disponible de inmediato en **`http://localhost:3000`**
>   - Documentación Interactiva (Swagger UI): **`http://localhost:3000/docs`**
> - 🟪 **`[SPA]` Frontend (Angular 22):** Disponible de inmediato en **`http://localhost:4200`**

---

### Paso 3: Verificación de Calidad y Tests en 1 Comando

```bash
# 1. Ejecución de la suite completa de 352 tests unitarios (128 backend Jest + 224 frontend Vitest)
npm test

# 2. Informes de cobertura de código unificados (> 90% en backend y > 95% en frontend)
npm run test:coverage

# 3. Análisis estático ultra-rápido con Oxlint (0 errores, 0 advertencias)
npm run lint

# 4. Compilación de producción unificada (Backend dist + Frontend dist)
npm run build
```

---

## 🗄️ Carga de Datos y Seeder (Facilidad de Evaluación)

Como los archivos `*.sqlite` están excluidos del repositorio por higiene de Git, el proyecto incorpora mecanismos para garantizar una experiencia de evaluación inmediata y rica en datos:

1. **Auto-Seeder Inteligente en Primer Arranque:** Al arrancar el backend (`npm start`), el servicio `DatabaseSeederService` verifica si la tabla `customers` está vacía. Si detecta 0 clientes, puebla automáticamente **18 corporaciones internacionales** (Telefónica, Inditex, Mercadona, SEAT, Santander, Celonis, Doctolib, Snowflake...) con **CIFs/NIFs 100% matemáticamente válidos** según el algoritmo de control de la AEAT y sus simulaciones históricas pre-calculadas.
2. **Script Manual de Reseteo (`npm run seed`):**
   ```bash
   npm --prefix mic-saas-omatic run seed
   ```
   Restaura de fábrica el catálogo completo de clientes y simulaciones con logs estructurados en consola.
3. **Formulario de Alta con Validación Algorítmica AEAT en Tiempo Real (`+ Registrar Cliente`):**
   En la interfaz web (`/customers`), el botón destacado `+ Registrar Cliente` abre un diálogo modal reactivo donde el evaluador puede comprobar la validación matemática en vivo: teclear un CIF inventado erróneo (ej. `B12345678`) mostrará el error al vuelo; un CIF válido (ej. `B85638641`) permitirá el alta inmediata y el cliente aparecerá al instante en el listado y en el selector de simulaciones.

---

## 🖥️ Flujo de Trabajo Alternativo (Terminales Separadas)

Si el evaluador prefiere monitorizar los servicios en pestañas de terminal independientes:

| Módulo | Comando desde la raíz | Comando tradicional (en subdirectorio) | URL / Puerto |
| :--- | :--- | :--- | :--- |
| **Backend (NestJS)** | `npm run start:backend` | `cd mic-saas-omatic && npm run start:dev` | `http://localhost:3000` (`/docs`) |
| **Frontend (Angular)** | `npm run start:frontend` | `cd spa-saas-omatic && npm start` | `http://localhost:4200` |

---

## 🐳 Despliegue Containerizado con Docker (Opción 100% Aislada)

Para evaluadores que prefieran levantar todo el ecosistema de forma aislada sin requerir Node.js ni npm instalados en su máquina anfitriona, el repositorio incluye soporte completo de **Docker & Docker Compose**:

> [!IMPORTANT]
> **Requisitos para esta opción:**
> 1. Requiere tener instalado **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Windows / macOS) o **Docker Engine + Docker Compose** (Linux).
> 2. El servicio de Docker Desktop debe estar **abierto y en ejecución en segundo plano** antes de lanzar el comando.
> 3. En Windows, Docker Desktop requiere tener habilitado el backend WSL 2 (Windows Subsystem for Linux) o Hyper-V.
> 
> *💡 Si en tu terminal ves `'docker' no se reconoce como un comando`, significa que no tienes Docker Desktop instalado o configurado en el PATH. En ese caso, utiliza la **Opción Rápida con `npm start`**, que no requiere Docker.*

```bash
# Compilar y arrancar ambos contenedores en una red aislada:
docker compose up --build
```

### Arquitectura de Contenedores:
1. **Backend (`saas-omatic-backend`):**
   - Construcción multi-stage en `node:22-slim` con compilación nativa de `better-sqlite3`.
   - Purga de dependencias de desarrollo (`--omit=dev`) y herramientas de compilación para una imagen ultra-ligera y segura.
   - Volumen persistente Docker (`sqlite-data`) montado en `/app/data/saas_o_matic.sqlite` con modo WAL.
   - Healthcheck nativo en Node.js que valida la disponibilidad de la API antes de permitir tráfico.
   - Expuesto en **`http://localhost:3000`** (con Swagger UI en `/docs`).
2. **Frontend (`saas-omatic-frontend`):**
   - Construcción multi-stage: compilación de producción de Angular 22 en Node 22 y servido en servidor web **Nginx 1.27 Alpine**.
   - Configuración `nginx.conf` con compresión gzip, cabeceras de seguridad OWASP y soporte de enrutamiento HTML5 pushState (`try_files $uri $uri/ /index.html;`).
   - Reverse proxy interno hacia el contenedor backend para las rutas `/customers`, `/simulations`, `/emails` y `/docs`.
   - Expuesto en **`http://localhost:4200`** (y también en puerto HTTP estándar **`http://localhost:80`**).
3. **Parada limpia de contenedores:**
   ```bash
   docker compose down
   ```

---

## ⚙️ Variables de Entorno y Configuración

El proyecto cuenta con plantillas de variables de entorno versionadas:

- **Global / Docker:** [`.env.example`](.env.example) en la raíz para orquestación de puertos y servicios.
- **Backend (`mic-saas-omatic`):** [`mic-saas-omatic/.env.example`](mic-saas-omatic/.env.example) para configuración del servidor NestJS y SQLite.
- **Frontend (`spa-saas-omatic`):** Gestión nativa de Angular en `src/environments/` (`environment.ts` y `environment.development.ts`) para desacoplar las URLs de la API y de tipos de cambio.

---

## 🧪 Pirámide de Pruebas y Cobertura (Testing Strategy)

El proyecto cuenta con cobertura exhaustiva (284 pruebas unitarias y de integración pasando al 100% con 90% en backend y 93% en frontend):

```bash
# Ejecutar la suite completa desde la raíz:
npm test

# Ejecutar el informe de cobertura unificado (90.0% backend / 93.0% frontend):
npm run test:coverage

# O ejecutar por separado según el módulo de interés:
npm run test:backend           # 123 tests de Dominio, Casos de Uso, Mappers, Servicios Fiscales y E2E
npm run test:frontend          # 161 tests de Componentes, Signals, Servicios i18n, Dialogs y Pipes (Vitest)
npm run test:coverage:backend  # Reporte de cobertura Jest (90.0% líneas)
npm run test:coverage:frontend # Reporte de cobertura Vitest v8 (93.0% líneas)
```

### Detalle por subsistema:

#### Backend (`mic-saas-omatic`):
```bash
cd mic-saas-omatic
npm test           # Tests unitarios con Jest
npm run test:cov   # Reporte de cobertura de código con Jest
npm run test:e2e   # Tests de integración HTTP con supertest + SQLite real
npm run test:all   # Suite unificada
```

#### Frontend (`spa-saas-omatic`):
```bash
cd spa-saas-omatic
npm test           # Tests unitarios deterministas con Vitest
npm run test:cov   # Reporte de cobertura de código con Vitest v8
npm run test:watch # Modo interactivo watch con recarga en caliente
```

---

## 🔍 Análisis Estático y Calidad de Código (Linter Oxlint)

El proyecto utiliza **Oxlint** (`oxlint` + `oxlint-tsgolint`), un linter ultrarrápido programado en Rust con soporte *type-aware* e inspección de promesas flotantes:

```bash
# Ejecutar en todo el proyecto desde la raíz (129 archivos en < 1 segundo):
npm run lint
```
> Oxlint reporta advertencias y errores indicando la ruta del fichero, línea, columna y bloque contextual de código. Ambos proyectos pasan con **0 errores y 0 advertencias**.

---

## 🐳 Despliegue con Docker

Para levantar la solución completa en contenedores sin fricción:

```bash
# Desde la raíz del repositorio
docker compose up --build
```

---

## 📬 Documentación de la API y Pruebas

- **Documentación Interactiva (Swagger UI):** `http://localhost:3000/docs`
- **Contrato OpenAPI 3.0 (Fuente Única de Verdad):** [`ai-workspace/01-specs/openapi.yaml`](ai-workspace/01-specs/openapi.yaml)
- **Colección de Postman v2.1:** [`ai-workspace/01-specs/saas-o-matic.postman_collection.json`](ai-workspace/01-specs/saas-o-matic.postman_collection.json) *(incluye scripts de auto-captura de `customerId` para encadenar peticiones sin copiar IDs)*.

---

## 🧠 Espacio de Trabajo con IA (`/ai-workspace`)

En cumplimiento con los criterios de evaluación del reto (35% Planificación y 25% Control de Calidad):

1. **[`01-specs/`](ai-workspace/01-specs/)**: Especificaciones funcionales rigurosas (`functional-specs.md`), reglas fiscales (DNI/NIE/CIF y tramos graduales) y contrato `openapi.yaml`.
2. **[`02-architecture/`](ai-workspace/02-architecture/)**: Directrices de Arquitectura Hexagonal (`architecture-guidelines.md`), principios SOLID, árbol canónico, decisiones de concurrencia y gobernanza de IA (Sección 6).
3. **[`03-vibe-coding-log/`](ai-workspace/03-vibe-coding-log/)**: Bitácora cronológica auditada (`prompts-and-audits.md`) con las dos dimensiones del rol de Director de Orquesta: inputs estratégicos de arquitectura y auditoría continua de calidad frente a los sesgos de la IA.
4. **Gobernanza Persistente del Agente de IA**: Configuración universal viva en la raíz con [`AGENTS.md`](AGENTS.md) y [`.agents/rules/coding-standards.md`](.agents/rules/coding-standards.md), reconocida automáticamente por los principales agentes de desarrollo (Google Antigravity, Cursor, Claude Code, Gemini CLI, Copilot) para forzar el cumplimiento incondicional de los estándares de calidad.
