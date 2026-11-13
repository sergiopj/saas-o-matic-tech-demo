# 🚀 SaaS-O-Matic — Dynamic Billing & Subscription Optimizer

> **Reto Técnico Roams:** Herramienta interna para que el equipo comercial pueda simular, optimizar y presupuestar suscripciones SaaS multi-divisa para clientes corporativos.

Proyecto construido bajo **Arquitectura Hexagonal (Puertos y Adaptadores)**, metodología **Spec-Driven Development (API-First)** y desarrollo asistido por IA auditado (**Vibe Coding** con control de calidad continuo).

---

## 📁 Estructura del Repositorio

El proyecto sigue una convención corporativa de microservicio y single-page application:

- **`mic-saas-omatic/`**: Microservicio Backend desarrollado con **NestJS 12**, **TypeScript**, **SQLite (`better-sqlite3`)** y persistencia en modo WAL.
- **`spa-saas-omatic/`**: Frontend Dashboard Comercial desarrollado con **Angular 22** (Standalone Components y Signals reactivos).
- **`ai-workspace/`**: Espacio de trabajo y auditoría del proceso de ingeniería con IA (especificaciones, arquitectura y bitácora de vibe coding).

---

## 📋 Requisitos Previos

- **Node.js**: `>= 22.x LTS` (probado en Node v22.14.0+)
- **npm**: `>= 10.x`
- **Docker & Docker Compose**: *(Opcional, para ejecución containerizada)*
- *(No requiere instalar bases de datos externas: utiliza SQLite embebido en disco con WAL mode)*.

---

## ⚙️ Variables de Entorno y Configuración

El proyecto cuenta con plantillas de variables de entorno versionadas:

- **Global / Docker:** [`.env.example`](.env.example) en la raíz para orquestación de puertos y servicios.
- **Backend (`mic-saas-omatic`):** [`mic-saas-omatic/.env.example`](mic-saas-omatic/.env.example) para configuración del servidor NestJS y SQLite.
- **Frontend (`spa-saas-omatic`):** Gestión nativa de Angular en `src/environments/` (`environment.ts` y `environment.development.ts`) para desacoplar las URLs de la API y de tipos de cambio.

---

## ⚡ Puesta en Marcha Rápida (Backend en Local)

### 1. Instalación de Dependencias
```bash
cd mic-saas-omatic
npm install
```

### 2. Levantar la API en Modo Desarrollo
```bash
npm run start:dev
```
> La API quedará disponible de inmediato en **`http://localhost:3000`** (sin prefijo `/api/v1`, conforme a la especificación oficial del reto).

---

## 🧪 Pirámide de Pruebas (Testing Strategy)

El proyecto cuenta con cobertura exhaustiva separada en distintos *feedback loops*:

### Backend (`mic-saas-omatic`):
```bash
cd mic-saas-omatic

# 1. Tests Unitarios (Dominio puro, Casos de Uso con mocks, Mappers, Servicios Fiscales)
npm test

# 2. Tests de Integración E2E (Pipeline HTTP real con supertest + SQLite real en disco)
npm run test:e2e

# 3. Suite Completa Unificada (Ejecución determinista para CI/CD y pre-commit)
npm run test:all
```

### Frontend (`spa-saas-omatic`):
```bash
cd spa-saas-omatic

# 1. Tests Unitarios con Vitest (Modo ejecución determinista de una pasada para evaluación)
npm test

# 2. Modo interactivo en desarrollo (Watch mode con recarga en caliente)
npm run test:watch
```

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
2. **[`02-architecture/`](ai-workspace/02-architecture/)**: Directrices de Arquitectura Hexagonal (`architecture-guidelines.md`), principios SOLID, árbol canónico y decisiones de concurrencia.
3. **[`03-vibe-coding-log/`](ai-workspace/03-vibe-coding-log/)**: Bitácora cronológica auditada (`prompts-and-audits.md`) con las dos dimensiones del rol de Director de Orquesta: inputs estratégicos de arquitectura y auditoría continua de calidad frente a los sesgos de la IA.
