# 🛠️ mic-saas-omatic — Backend Service

Microservicio Backend para la optimización y facturación dinámica de SaaS-O-Matic, desarrollado con **NestJS 12**, **TypeScript** y **SQLite (`better-sqlite3`)**.

---

## 🏗️ Arquitectura

El microservicio implementa **Arquitectura Hexagonal (Puertos y Adaptadores)** estricta:

- **`domain/`**: Núcleo de negocio en TypeScript puro (cero dependencias de NestJS o TypeORM). Contiene entidades (`Customer`, `Simulation`), servicios de cálculo (`PricingEngineService`, `TaxCalculatorService`, `SpanishFiscalValidator`) y excepciones de dominio.
- **`application/`**: Casos de uso atómicos organizados por puertos de entrada y salida (`ports/in/`, `ports/out/`).
- **`infrastructure/`**: Adaptadores primarios REST (`controllers/`, DTOs con `class-validator`) y adaptadores secundarios de persistencia (`adapters/out/persistence/` con TypeORM, mappers y entidades SQLite).

### 🛡️ Resiliencia en DTOs y Validación de UUIDs RFC
- En `CreateSimulationDto`, la validación de `customerId` utiliza una expresión regular estándar compatible con cualquier identificador RFC 4122 (versiones 1 a 5) y con el estándar moderno RFC 9562 (UUIDv7 ordenado por tiempo):
  ```typescript
  @Matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
  ```
  Evita falsos rechazos `400 Bad Request` ante identificadores legítimos no estrictos v4 procedentes de clientes externos o fixtures de prueba.

### 🗄️ Estrategia de Persistencia: SQLite WAL + Seeder Idempotente vs. Migraciones
- **Modo WAL (`enableWAL: true`):** SQLite opera en modo Write-Ahead Logging, permitiendo lecturas concurrentes sin bloquear escrituras.
- **Auto-Seeder Idempotente:** En el arranque local (`npm start`), `DatabaseSeederService` verifica si la base de datos está vacía y puebla automáticamente 18 clientes corporativos y sus simulaciones sin pasos manuales.
- **¿Por qué no migraciones manuales en esta tech demo?** Las migraciones DDL (`typeorm migration:run`) son esenciales en entornos productivos multi-desarrollador con PostgreSQL o MySQL para auditar cambios de esquema. En una prueba técnica local, obligar al evaluador a ejecutar comandos de migración añadiría fricción innecesaria; la combinación de `synchronize: true` + SQLite WAL + Seeder Idempotente proporciona la experiencia de evaluación inmediata y robusta (*Frictionless DX*).

### 📦 Evolución de Esquemas y Compatibilidad de Datos
- **Compatibilidad con Datos Existentes:** Para garantizar que los datos ya persistidos en SQLite sigan siendo válidos ante la evolución de entidades (nuevos campos o atributos), las columnas nuevas deben declararse siempre como `@Column({ nullable: true })` o con un `@Column({ default: ... })`. Esto evita errores de integridad relacional en SQLite ante filas previas.
- **Patrón Expand/Contract:** En despliegues empresariales continuos (Blue/Green), los cambios de esquema se ejecutan en dos fases: primero se añade la columna compatible (Expand) para que convivan versiones v1 y v2 del software, y posteriormente se migran los datos históricos y se consolidan las restricciones (Contract).
- **Flujo de Migraciones en Producción (TypeORM CLI):**
  ```bash
  # Generar migración diferencial:
  npx typeorm-ts-node-commonjs migration:generate src/infrastructure/adapters/out/persistence/migrations/UpdateSchema -d src/data-source.ts
  # Aplicar migraciones:
  npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
  # Revertir última migración:
  npx typeorm-ts-node-commonjs migration:revert -d src/data-source.ts
  ```

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

# 4. Pasar el linter estático (Oxlint con soporte Type-Aware)
npm run lint
```

---

## 🧪 Pruebas

```bash
# Tests Unitarios (128 tests unitarios pasando al 100% en 26 suites)
npm test

# Tests de Integración E2E contra SQLite real
npm run test:e2e

# Toda la suite (Unitarios + E2E secuencial)
npm run test:all
```

---

## 🔍 Análisis Estático y Linter (`oxlint`)

```bash
npm run lint
# Ejecuta: oxlint --type-aware src/ test/
```

- Inspección de 60 archivos TypeScript en ~600 ms.
- Configuración declarativa en [`.oxlintrc.json`](.oxlintrc.json).

---

## 📖 Documentación Interactiva (Swagger UI)

Con el servidor levantado, la interfaz gráfica interactiva de Swagger UI se encuentra disponible en:
👉 **`http://localhost:3000/docs`**

Renderiza dinámicamente el contrato API-First [`../ai-workspace/01-specs/openapi.yaml`](../ai-workspace/01-specs/openapi.yaml) manteniendo el código limpio de decoradores de documentación.

