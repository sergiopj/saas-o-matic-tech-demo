# 🛠️ mic-saas-omatic — Backend Service

Microservicio Backend para la optimización y facturación dinámica de SaaS-O-Matic, desarrollado con **NestJS 12**, **TypeScript** y **SQLite (`better-sqlite3`)**.

---

## 🏗️ Arquitectura

El microservicio implementa **Arquitectura Hexagonal (Puertos y Adaptadores)** estricta:

- **`domain/`**: Núcleo de negocio en TypeScript puro (cero dependencias de NestJS o TypeORM). Contiene entidades (`Customer`, `Simulation`), servicios de cálculo (`PricingEngineService`, `TaxCalculatorService`, `SpanishFiscalValidator`) y excepciones de dominio.
- **`application/`**: Casos de uso atómicos organizados por puertos de entrada y salida (`ports/in/`, `ports/out/`).
- **`infrastructure/`**: Adaptadores primarios REST (`controllers/`, DTOs con `class-validator`) y adaptadores secundarios de persistencia (`adapters/out/persistence/` con TypeORM, mappers y entidades SQLite).

Para ver las directrices completas, consulta [`../ai-workspace/02-architecture/architecture-guidelines.md`](../ai-workspace/02-architecture/architecture-guidelines.md).

---

## ⚙️ Variables de Entorno y Configuración (`.env`)

El backend soporta carga nativa de variables de entorno (Node.js 20.6+ `process.loadEnvFile`). Se proporciona una plantilla [`.env.example`](.env.example) versionada:

```bash
# Copiar plantilla para entorno local si se desea personalizar
cp .env.example .env
```

| Variable | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `3000` | Puerto HTTP donde escucha el microservicio NestJS. |
| `DATABASE_NAME` | String | `saas_o_matic.sqlite` | Nombre del fichero de base de datos SQLite en disco. |
| `NODE_ENV` | String | `development` | Modo de ejecución de la aplicación. |

---

## ⚡ Comandos Rápidos

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor en desarrollo (http://localhost:3000)
npm run start:dev

# 3. Compilar para producción
npm run build
npm run start:prod
```

---

## 🧪 Pruebas

```bash
# Tests Unitarios
npm test

# Tests de Integración E2E contra SQLite real
npm run test:e2e

# Toda la suite (Unitarios + E2E secuencial)
npm run test:all
```

---

## 📖 Documentación Interactiva (Swagger UI)

Con el servidor levantado, la interfaz gráfica interactiva de Swagger UI se encuentra disponible en:
👉 **`http://localhost:3000/docs`**

Renderiza dinámicamente el contrato API-First [`../ai-workspace/01-specs/openapi.yaml`](../ai-workspace/01-specs/openapi.yaml) manteniendo el código limpio de decoradores de documentación.

