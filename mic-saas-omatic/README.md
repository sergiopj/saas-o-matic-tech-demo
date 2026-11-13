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
