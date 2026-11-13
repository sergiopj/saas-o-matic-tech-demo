# 🎨 spa-saas-omatic — Frontend Dashboard

Dashboard Comercial interactivo para la optimización y presupuestado dinámico de suscripciones SaaS multi-divisa, desarrollado con **Angular 22**, **Standalone Components**, **Signals reactivos**, **Built-in Control Flow (`@if`, `@for`)** y **Angular Material** personalizado.

---

## 🏗️ Arquitectura del Frontend

El frontend sigue una arquitectura orientada al dominio (**Feature-Driven**) con simetría 1:1 respecto al backend NestJS:

- **`src/app/core/`**: Infraestructura transversal de la aplicación:
  - `errors/`: Formato estándar de errores **RFC 7807** (`problem-detail.model.ts`) e interceptor funcional global (`error.interceptor.ts`).
  - `i18n/`: Catálogo de traducciones bilingüe (español/inglés) fuertemente tipado (`translations.ts`).
  - `models/`: Modelo de divisas (`currency.model.ts`) utilizando el patrón **`as const`** de TypeScript moderno.
  - `services/`: Tipos de cambio (`currency.service.ts`) y servicio de localización reactiva con Signals (`i18n.service.ts`).
- **`src/app/modules/`**: Módulos funcionales de negocio (simetría estricta con `mic-saas-omatic`):
  - `customers/`: Búsqueda, listado en tarjetas y detalle de clientes (`customer-api.service.ts`).
  - `simulations/`: Historial, cálculo de tramos a 60 FPS en memoria (`local-pricing-calculator.ts`) y persistencia bajo demanda (`simulation-api.service.ts`).
- **`src/app/shared/`**: Elementos transversales de UI:
  - `components/`: Navbar corporativa estilo Roams, selector de divisas con Signals y visualizador RFC 7807.
  - `pipes/`: `localized-currency.pipe.ts` con internacionalización nativa mediante `Intl.NumberFormat` (respetando orden de símbolos, puntuación cultural de millares/decimales y especificidades como 0 decimales en `JPY`).

Para ver las directrices completas, consulta [`../ai-workspace/02-architecture/architecture-guidelines.md`](../ai-workspace/02-architecture/architecture-guidelines.md).

---

## ⚙️ Gestión de Entornos (`src/environments/`)

En aplicaciones cliente (SPA) que se ejecutan en el navegador del usuario, no existe el runtime de Node.js ni `process.env`. Angular gestiona la configuración mediante ficheros tipados en `src/environments/`:

- **`environment.development.ts`**: Utilizado durante `npm start` (desarrollo local contra `http://localhost:3000`).
- **`environment.ts`**: Utilizado en compilaciones de producción (`npm run build`).

| Propiedad | Tipo | Valor | Propósito |
| :--- | :--- | :--- | :--- |
| `production` | Boolean | `false` / `true` | Indicador de modo producción para optimizaciones de Angular. |
| `apiBaseUrl` | String | `http://localhost:3000` | URL base del microservicio backend NestJS. |
| `currencyApiUrl` | String | `https://open.er-api.com/v6/latest/EUR` | Endpoint público para obtener tipos de cambio en vivo. |

---

## ⚡ Comandos de Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor de desarrollo (http://localhost:4200)
npm start

# 3. Compilar para producción (dist/)
npm run build
```

---

## 🧪 Pruebas Unitarias (Vitest)

Las pruebas están configuradas con **Vitest** (el ejecutor nativo de Angular 22) para máxima velocidad de ejecución:

```bash
# Ejecución limpia de una sola pasada (ideal para evaluación y CI/CD)
npm test

# Modo interactivo en desarrollo (recarga en caliente ante cambios)
npm run test:watch
```

---

## 🔗 Integración con Backend

El frontend se conecta al microservicio `mic-saas-omatic` en `http://localhost:3000`.  
La URL base se encuentra centralizada en `src/environments/environment.ts` para permitir portabilidad inmediata en Docker y despliegues productivos.
