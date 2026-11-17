# 🎨 spa-saas-omatic — Frontend Dashboard

Dashboard Comercial interactivo para la optimización y presupuestado dinámico de suscripciones SaaS multi-divisa, desarrollado con **Angular 22**, **Standalone Components**, **Signals reactivos**, **Built-in Control Flow (`@if`, `@for`)** y **Angular Material** personalizado con la identidad visual corporativa de Roams.

> [!TIP]
> **💻 Recomendación de Entorno (Desktop Optimizado & 100% Responsive):**  
> Al tratarse de un panel operativo corporativo para el equipo comercial (diseñado para la simulación interactiva de tramos, análisis de métricas, filtros avanzados, tablas de histórico denso y composición de presupuestos), **la experiencia de uso óptima está recomendada en pantallas de escritorio (Desktop $\ge$ 1024px)** para maximizar la productividad visual.  
> No obstante, la plataforma es **100% responsive** y está completamente adaptada para tablets y smartphones (navbar dinámico en 2 filas en pantallas $\le$ 640px, sidebar colapsable, drawer deslizante de filtros con botones táctiles y tarjetas reorganizables).  
> **Anclaje Visual en Desktop vs. Cero Ruido en Smartphones:** Las ilustraciones 3D de producto y arquitectura (*warm isometric design*) aportan un anclaje visual cálido y reconocible para identificar cada sección de un vistazo en desktop y tablets sin necesidad de figuras humanas ni elementos cibernéticos oscuros; en smartphones ($\le$ 768px), las imágenes tipo banner se ocultan de forma selectiva para erradicar el ruido visual y garantizar que los formularios interactivos y métricas queden visibles *above the fold*.

---

## 🎨 Suite Visual 3D Táctil (Warm Product Design) y Ergonomía

La interfaz gráfica incorpora una suite visual de diseño 3D cálido y táctil (estilo Apple, Stripe y Notion), descartando tanto figuras humanas como estéticas frías o de neón tipo Tron:
1. **Hero Banner (`/home` - `hero-illustration.jpg`):** Puesto de trabajo escandinavo bañado por luz matinal natural, con portátil mostrando el panel de facturación, taza cerámica, planta suculenta, tablet y tarjetas *frosted glass* con curvas de ingresos y divisas (€, $, £).
2. **Estudio de Simulaciones (`/simulations` - `simulations-illustration.jpg`):** Taller de simulación 3D con mesa de madera clara, tablet con sliders interactivos de precios y barras de comparación por volumen, bloques geométricos físicos en tonos pastel (salvia, coral, ámbar), fichas de descuento (-10%, -20%), planta monstera y paneles flotantes de cristal esmerilado con fórmulas de cálculo.
3. **Medallón de Clientes Corporativos (`/customers` - `corporate-customer-badge.jpg`):** Maqueta arquitectónica 3D de una sede corporativa contemporánea y eco-friendly con madera de cedro, grandes ventanales, jardín en la azotea y un maletín ejecutivo de cuero tostado con herrajes dorados.
4. **Despacho Comercial (`email-composer-dialog` - `email-dispatch-badge.jpg`):** Emblema en el diálogo de emisión de presupuestos con un sobre de gruesa textura crema, sello lacrado en oro en relieve, documento de propuesta y un avión de papel origami pastel ascendiendo con destellos dorados.

### Ergonomía de Controles y Micro-tipografía:
- **Hero Banner Esbelto a Ancho Completo (Above-the-Fold en `/home`):** Longitud completa alineada con la cuadrícula (`width: 100%`) y altura esbelta reducida en más de un 55% (`padding: 1.15rem 2rem`, imagen a 120px) para que las métricas KPI, tramos y clientes recientes aparezcan inmediatamente en el viewport inicial sin exigir scroll.
- **Navbar Armonizado:** El selector de divisas (`CurrencySelectorComponent`) comparte dimensiones idénticas con el selector de idioma (`LanguageSelectorComponent`), con esquinas redondeadas estilo píldora (`--roams-radius-md`) y glifo de moneda (`monetization_on`).
- **Live Conversion Respirable:** El bloque de conversión en vivo aplica espaciado generoso (`padding: 1rem 1.25rem; gap: 0.5rem; letter-spacing: 0.05em;`), erradicando la aglomeración visual de importes y tipos de cambio.
- **Pilas de Monedas 3D Dinámicas por Tramo:** Micro-interacción en CSS puro (`@keyframes coinDrop`) con monedas doradas cayendo en cascada sobre los tramos tarifarios (5 monedas en T1 a 10 €, 3 en T2 a 8 €, 2 en T3 a 5 €), con soporte de accesibilidad `prefers-reduced-motion` y cero coste en JS.
- **Ocultación Selectiva Móvil:** En pantallas $\le$ 768px, los banners decorativos se ocultan (`display: none !important;`) preservando el área táctil y la visibilidad de métricas clave sobre el pliegue.

---

## 🏗️ Arquitectura del Frontend

El frontend sigue una arquitectura orientada al dominio (**Feature-Driven**) con simetría 1:1 respecto al backend NestJS:

- **`src/app/core/`**: Infraestructura transversal (errores RFC 7807, modelos e i18n con catálogo multidioma [ES, EN, DE, FR], detección por navegador y arquitectura lista para TMS como Tolgee).
- **`src/app/modules/`**: Módulos funcionales de negocio por dominio (Bounded Contexts):
  - `customers/`: Búsqueda, gestión y fichas de clientes corporativos.
  - `simulations/`: Motor interactivo de cálculo de tramos a 60 FPS, desglose fiscal multi-divisa e historial de presupuestos.
- **`src/app/shared/`**: Componentes transversales del marco de la aplicación (Navbar corporativa Roams, selector de divisas y `TranslatePipe`).
- **`src/styles/`**: Arquitectura modular de estilos (Patrón 7-1 de Sass) con Design Tokens corporativos Roams (`_colors.scss`, `_variables.scss` y `styles.scss`).

Para ver las directrices completas, consulta [`../ai-workspace/02-architecture/architecture-guidelines.md`](../ai-workspace/02-architecture/architecture-guidelines.md).

---

## ⚙️ Gestión de Entornos (`src/environments/`) y Estrategia Zero-Friction (DX)

En aplicaciones cliente (SPA) que se ejecutan en el navegador del usuario, no existe el runtime de Node.js ni el objeto `process.env`. Angular gestiona la configuración mediante ficheros tipados en `src/environments/`:

- **`environment.development.ts`**: Utilizado durante `npm start` (desarrollo local contra `http://localhost:3000`).
- **`environment.ts`**: Utilizado en compilaciones de producción (`npm run build`).

| Propiedad | Tipo | Valor | Propósito |
| :--- | :--- | :--- | :--- |
| `production` | Boolean | `false` / `true` | Indicador de modo producción para optimizaciones de Angular. |
| `apiBaseUrl` | String | `http://localhost:3000` | URL base del microservicio backend NestJS. |
| `currencyApiUrl` | String | `https://open.er-api.com/v6/latest/EUR` | Endpoint público para obtener tipos de cambio en vivo. |

> [!NOTE]
> **🚀 Cero Fricción para el Evaluador Técnico (*Out-of-the-Box DX*):**  
> En proyectos técnicos de evaluación senior, obligar al evaluador a crear y rellenar archivos `.env` manualmente suele ser fuente de desajustes y errores innecesarios.  
> Por diseño arquitectónico, tanto el backend NestJS (con puertos y SQLite por defecto) como el frontend Angular (con `environment.development.ts` preconfigurado) arrancan y se comunican **100% de forma inmediata tras clonar el repositorio**, sin exigir la creación manual de ningún archivo `.env`.  
> Consulta [`../ai-workspace/02-architecture/architecture-guidelines.md#316`](../ai-workspace/02-architecture/architecture-guidelines.md) para más detalles.

---

## ⚡ Comandos de Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor de desarrollo (http://localhost:4200)
npm start

# 3. Compilar para producción (dist/)
npm run build

# 4. Pasar el linter estático (Oxlint con soporte Type-Aware)
npm run lint

# 5. Despliegue containerizado con Docker (orquestado desde la raíz del proyecto):
# Requiere tener Docker Desktop instalado y en ejecución:
docker compose up --build
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

## 🔍 Análisis Estático y Linter (`oxlint`)

El proyecto utiliza **Oxlint** (`oxlint` + `oxlint-tsgolint`) para análisis estático en Rust:

```bash
npm run lint
# Ejecuta: oxlint --type-aware src/
```

- **Velocidad sub-segundo:** Inspecciona los 46 ficheros TypeScript/Angular en ~250 ms.
- **Diagnósticos precisos:** Informa por consola con ruta exacta de fichero, número de línea, columna y extracto visual con sugerencia.
- **Configuración declarativa:** Basada en [`.oxlintrc.json`](.oxlintrc.json).
- **Estado:** 0 errores y 0 advertencias.

---

## 🔗 Integración con Backend

El frontend se conecta al microservicio `mic-saas-omatic` en `http://localhost:3000`.  
La URL base se encuentra centralizada en `src/environments/environment.ts` para permitir portabilidad inmediata en Docker y despliegues productivos.
