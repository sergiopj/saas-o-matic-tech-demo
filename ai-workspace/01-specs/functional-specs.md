# SaaS-O-Matic: Especificaciones Funcionales y de Negocio
**Proyecto:** SaaS-O-Matic (Dynamic Billing & Subscription Optimizer)  
**Versión del Documento:** 1.0.0  
**Estado:** Aprobado / Línea Base  
**Contexto de Entrega:** Prueba Técnica Roams  

---

## 1. Resumen Ejecutivo y Objetivo

SaaS-O-Matic es una herramienta comercial interna diseñada para que el equipo de ventas pueda simular, optimizar y presupuestar suscripciones SaaS multi-divisa para clientes corporativos.

El sistema proporciona:
1. **Gestión de Clientes Corporativos (`Customer`)** con validación fiscal algorítmica estricta (algoritmos oficiales de la AEAT para DNI, NIE y CIF en España; validación de formato para entidades internacionales).
2. **Motor de Facturación Dinámica por Tramos y Simulación (`Simulation`)** que aplica tarificación acumulativa progresiva basada en usuarios activos, registro de métricas de almacenamiento y llamadas a API, y cálculo de impuestos según la jurisdicción fiscal del cliente.
3. **Dashboard Comercial Interactivo** con tarjetas responsive, slider interactivo de proyección en tiempo real (cálculo local en frontend antes de persistir), historial cronológico de simulaciones y conversión de divisas en vivo contra una API pública de tipos de cambio.

---

## 2. Entidades de Dominio y Reglas de Negocio

> **Nota de estilo y arquitectura:** Siguiendo el estándar de la industria, las entidades, atributos, variables y métodos se definen en inglés (`Customer`, `Simulation`, `taxId`), mientras que toda la especificación funcional y documentación técnica se redacta en español.

---

### 2.1 Cliente Corporativo (`Customer`)

Representa una entidad legal corporativa registrada en el sistema.

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | String / UUID v4 | Clave Primaria, Autogenerado | Identificador único del cliente. |
| `companyName` | String | Requerido, trim, min 2, max 120 caracteres | Razón social o nombre de la empresa. |
| `taxId` | String | Requerido, único | Identificador fiscal (DNI, NIE, CIF o VAT extranjero). Se normaliza automáticamente (trim + mayúsculas + eliminación de espacios y guiones: `replace(/[\s-]/g, '').toUpperCase()`) antes de validar y persistir. |
| `email` | String | Requerido, formato RFC 5322 válido | Correo electrónico de contacto/facturación. |
| `country` | String (ISO 3166-1 alpha-2) | Requerido, exactamente 2 letras mayúsculas | Código de país que determina las reglas fiscales y de impuestos. |
| `selectedPlan` | String | Requerido, texto libre (min 2, max 50 caracteres) | Plan comercial elegido (ej. "Startup", "Enterprise", "Pro"). No restringido a enum según enunciado. |
| `createdAt` | String (ISO 8601 UTC) | Autogenerado en creación | Fecha y hora de alta en el sistema. |

#### Reglas de Negocio de `Customer`
1. **Unicidad de `taxId`:** No pueden existir dos clientes con el mismo identificador fiscal. Si se intenta registrar un duplicado, el sistema responde con `409 Conflict`.
2. **Búsqueda y Filtrado Server-Side:** El sistema debe permitir búsqueda parcial insensible a mayúsculas/minúsculas (`LIKE %search%`) tanto por `companyName`, `taxId` o `email`, así como filtrado exacto por jurisdicción fiscal (`country`). Ambos filtros operan de forma combinable directamente en el motor de base de datos del backend para garantizar consistencia con paginación y óptimo rendimiento.

---

### 2.2 Validación Fiscal Algorítmica Estricta (`taxId`)

La validación del identificador fiscal depende del valor del campo `country`:

#### A. España (`country === 'ES'`) - Validación Algorítmica Oficial Real (Prohibido solo Regex)
Se verifica contra los algoritmos oficiales del Ministerio del Interior y la Agencia Tributaria (AEAT):

1. **DNI (Documento Nacional de Identidad):**
   - Formato: 8 dígitos numéricos seguidos de 1 letra de control (`\d{8}[A-Z]`).
   - Algoritmo: `numero % 23` obtiene la posición en la tabla de asignación:  
     `TRWAGMYFPDXBNJZSQVHLCKE`  
     (`0=T, 1=R, 2=W, 3=A, 4=G, 5=M, 6=Y, 7=F, 8=P, 9=D, 10=X, 11=B, 12=N, 13=J, 14=Z, 15=S, 16=Q, 17=V, 18=H, 19=L, 20=C, 21=K, 22=E`).
   - La letra suministrada debe coincidir exactamente con la calculada.

2. **NIE (Número de Identidad de Extranjero):**
   - Formato: Comienza por letra `X`, `Y` o `Z`, seguido de 7 dígitos y 1 letra de control.
   - Conversión de prefijo: `X` se sustituye por `0`, `Y` por `1`, `Z` por `2`.
   - Algoritmo: Con los 8 dígitos resultantes, se aplica la misma operación `numero % 23` con la tabla `TRWAGMYFPDXBNJZSQVHLCKE`.

3. **CIF (Código de Identificación Fiscal - Personas Jurídicas y Entidades):**
   - Formato: 1 letra de tipo de entidad (`[ABCDEFGHJKLMNPQRSUVW]`, es decir, todas excepto I, Ñ, O, T, X, Y, Z) + 7 dígitos numéricos + 1 carácter de control (dígito o letra).
   - Sean los 7 dígitos centrales: $d_1, d_2, d_3, d_4, d_5, d_6, d_7$.
   - **Suma de posiciones pares:** $A = d_2 + d_4 + d_6$.
   - **Suma de posiciones impares multiplicadas por 2:** Para cada posición impar $d_i$ ($i \in \{1, 3, 5, 7\}$), se multiplica por 2. Si el resultado es $\ge 10$, se suman sus dígitos (o lo que es equivalente, resultado $- 9$).  
     $B = \sum \text{sumaDigitos}(2 \times d_{\text{impares}})$.
   - **Suma total:** $S = A + B$.
   - **Dígito de control base:** $C = (10 - (S \pmod{10})) \pmod{10}$.
   - **Reglas de asignación del carácter de control:**
     - Si la primera letra es `[K, P, Q, S]`: El control debe ser obligatoriamente una **letra** según la correspondencia:  
       `1=A, 2=B, 3=C, 4=D, 5=E, 6=F, 7=G, 8=H, 9=I, 0=J`.
     - Si la primera letra es `[A, B, E, H]`: El control debe ser obligatoriamente un **dígito numérico** igual a $C$.
     - Para el resto de letras (`[C, D, F, G, J, L, M, N, R, U, V, W]`): El control puede ser indistintamente el dígito numérico o la letra correspondiente.

#### B. Otros Países (`country !== 'ES'`)
- Formato: Cadena alfanumérica limpia con longitud mínima de 5 caracteres y máxima de 20 caracteres.

---

### 2.3 Simulación y Motor de Precios (`Simulation`)

Representa el cálculo proyectado de la suscripción para un cliente corporativo en un instante dado.

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | String / UUID v4 | Clave Primaria, Autogenerado | Identificador único de la simulación. |
| `customerId` | String / UUID v4 | Clave Foránea (`Customer.id`) | Referencia al cliente evaluado. |
| `activeUsers` | Integer | Requerido, entero $\ge 0$ | Número de usuarios activos simulados. |
| `storageGb` | Number / Float | Requerido, $\ge 0$ | Almacenamiento en GB (métrica histórica, coste base 0 €). |
| `apiCalls` | Integer | Requerido, entero $\ge 0$ | Llamadas a API estimadas (métrica histórica, coste base 0 €). |
| `monthlyBaseCost` | Number / Float | Calculado, 2 decimales | Coste mensual base en EUR según tramos acumulativos. |
| `taxRate` | Number / Float | Calculado según país del cliente | Porcentaje de impuesto aplicable (ej. `0.21` para 21%). |
| `taxAmount` | Number / Float | Calculado ($monthlyBaseCost \times taxRate$) | Importe del impuesto en EUR. |
| `totalCost` | Number / Float | Calculado ($monthlyBaseCost + taxAmount$) | Coste mensual total facturable en EUR. |
| `currency` | String | Fijo a `"EUR"` | Moneda base del backend. |
| `createdAt` | String (ISO 8601 UTC) | Autogenerado | Fecha y hora del cálculo de la simulación. |

#### A. Algoritmo de Tarificación Gradual Acumulativa por Tramos (Tiered Pricing)
El cálculo de `monthlyBaseCost` se efectúa exclusivamente sobre `activeUsers` mediante tramos acumulativos:

- **Tramo 1 (0 a 10 usuarios):** 10.00 € / usuario.
- **Tramo 2 (11 a 50 usuarios):** 8.00 € / usuario (aplicado únicamente a los usuarios por encima de 10).
- **Tramo 3 (Más de 50 usuarios):** 5.00 € / usuario (aplicado únicamente a los usuarios por encima de 50).

**Fórmula Matemática:**
$$\text{monthlyBaseCost}(u) = \begin{cases} 
0 & \text{si } u = 0 \\
u \times 10 & \text{si } 1 \le u \le 10 \\
(10 \times 10) + ((u - 10) \times 8) = 100 + (u - 10) \times 8 & \text{si } 11 \le u \le 50 \\
(10 \times 10) + (40 \times 8) + ((u - 50) \times 5) = 420 + (u - 50) \times 5 & \text{si } u > 50 
\end{cases}$$

**Batería Canónica de Casos de Prueba (Validación obligatoria):**
- $u = 0 \implies \mathbf{0.00\text{ €}}$
- $u = 10 \implies 10 \times 10 = \mathbf{100.00\text{ €}}$
- $u = 15 \implies (10 \times 10) + (5 \times 8) = 100 + 40 = \mathbf{140.00\text{ €}}$ *(ejemplo textual del enunciado oficial)*
- $u = 50 \implies 100 + (40 \times 8) = \mathbf{420.00\text{ €}}$
- $u = 60 \implies 420 + (10 \times 5) = \mathbf{470.00\text{ €}}$

#### C. Gobernanza de Precios: Inmutabilidad en Cliente y Autoridad Fiscal en Backend
- **¿Por qué los precios y límites de los tramos no son editables desde el frontend?**
  1. **Gobernanza de Precios y Políticas de Empresa (*Pricing Governance*):** En una compañía B2B SaaS, los precios unitarios por tramo los establece la dirección financiera y de Revenue Operations. La herramienta comercial permite al asesor simular y proyectar el impacto económico ajustando las variables de volumen (`activeUsers`, `storageGb`, `apiCalls`), pero nunca alterar las tarifas base aprobadas.
  2. **Integridad Transaccional y Prevención de Manipulación:** Permitir que el cliente HTTP envíe los precios unitarios al servidor supondría una vulnerabilidad crítica, ya que cualquier usuario podría alterar los valores en el payload de `POST /simulations`. El backend actúa como la única autoridad fiscal y de cálculo.
- **Principio Open/Closed (OCP) ante variaciones de tarifas (ej. subir Tramo 3 de 5.00 € a 6.00 €):**
  - La función de cálculo `calculateTieredPrice` desacopla por completo la estructura matemática de los datos tarifarios, iterando dinámicamente sobre la tupla inmutable `PRICING_TIERS` en `fiscal.constants.ts`.
  - Si la compañía decide actualizar el precio del Tramo 3 (ej. a 6.00 €) o incorporar un Tramo 4 para grandes cuentas (> 200 usuarios a 3.50 €), únicamente se actualiza la tupla de configuración, manteniéndose el motor de cálculo, las entidades y las interfaces cerradas a modificaciones de código pero abiertas a extensión.

#### D. Tabla de Impuestos por Jurisdicción
Los impuestos se determinan a partir del código de país (`country`) del cliente:

| País / Jurisdicción | Tipo Impositivo (`taxRate`) | Porcentaje | Motivo / Regla Fiscal |
| :--- | :--- | :--- | :--- |
| **España (ES)** | `0.21` | 21% | IVA general español. |
| **Alemania (DE)** | `0.19` | 19% | MwSt estándar. |
| **Francia (FR)** | `0.20` | 20% | TVA estándar. |
| **Italia (IT)** | `0.22` | 22% | IVA estándar. |
| **Reino Unido (GB)** | `0.20` | 20% | VAT estándar. |
| **Estados Unidos (US)** | `0.00` | 0% | SaaS no residente / Sin IVA federal. |
| **Resto de la Unión Europea** | `0.00` | 0% | Operación intracomunitaria B2B (Inversión del sujeto pasivo / Reverse Charge). |
| **Resto del Mundo** | `0.00` | 0% | Exportación de servicios digitales exenta de IVA local. |

---

## 3. Especificaciones del Frontend y Experiencia de Usuario (Dashboard)

> [!NOTE]
> **Recomendación de Entorno de Uso (Desktop Optimizado & 100% Responsive):**  
> Al tratarse de una herramienta analítica y operativa para el equipo comercial (con matrices de tramos, tablas de histórico denso, simulación interactiva a 60 FPS, filtros avanzados y composición de presupuestos), **la experiencia de uso óptima está diseñada para pantallas de escritorio (Desktop $\ge$ 1024px)**. No obstante, la plataforma es **100% responsive** y cuenta con adaptaciones específicas para tablets y smartphones (navbar en dos filas en $\le$ 640px, sidebar colapsable, drawer de filtros táctil y tarjetas reordenables).  
> **Anclaje Visual Inteligente vs. Cero Ruido en Smartphones:** En pantallas grandes (Desktop y Tablet), las ilustraciones 3D táctiles de producto y arquitectura (*warm isometric design*) aportan un anclaje visual limpio, acogedor y profesional (*visual anchoring*) que permite identificar de un solo vistazo la pantalla activa (Dashboard, Simulador y Catálogo) sin recurrir a figuras humanas ni a efectos cibernéticos oscuros. En smartphones ($\le$ 768px), las ilustraciones decorativas de gran tamaño se ocultan automáticamente (`display: none !important`) para eliminar el ruido visual, priorizar el espacio vertical sobre el pliegue (*above the fold*) y dejar acceso inmediato a los formularios, botones y métricas clave.

### 3.1 Arquitectura de Componentes
- **Tecnología:** Angular 21 (Standalone Components, Signals reactivos para estado local).
- **Vistas y Componentes Clave:**
  1. **Buscador, Filtro Jurisdiccional y Paginación Server-Side:**
     - Campo de búsqueda reactivo con *debounce* (300 ms) conectado a `GET /customers?search=...&country=...&page=...&limit=...`.
     - Selector de jurisdicción fiscal (`country`: ES, US, DE, FR, GB, IT, CH, SE) que filtra a nivel de base de datos SQL (`WHERE country = :country`).
     - **Paginación Server-Side y Feedback Contextual:** Controles de navegación de página (primera, anterior, números de página visibles con ventana deslizante $\pm 2$, siguiente, última) y selector configurable de tamaño de página (6 por defecto, 12, 24 clientes). Incorpora una barra de progreso lineal indeterminada de Material (`<mat-progress-bar>`) sobre el grid para transiciones de página, ordenación y filtrado, desacoplada del spinner local del campo de búsqueda (`isSearchingText`), con bloqueo defensivo de controles en vuelo (`[disabled]="customerApi.loading()"`) para evitar condiciones de carrera.
     - **Optimización de Renderizado en Scroll:** Las tarjetas de clientes aplican `content-visibility: auto` y `contain-intrinsic-size: auto 240px` (estándar W3C CSS Containment), evitando el coste de *layout* y *paint* en Chromium/Gecko de elementos fuera del *viewport*. La estrategia de detección de cambios `ChangeDetectionStrategy.OnPush` combinada con el bucle optimizado de Angular 19 `@for (...; track customer.id)` minimiza el consumo de memoria del DOM y elimina parpadeos durante el scroll o paginación.
  2. **Detalle del Cliente (Cards Responsive):**
     - Muestra datos fiscales, plan y país del cliente corporativo.
     - Historial con sus simulaciones guardadas ordenadas cronológicamente (`createdAt desc`).
  3. **Formulario de Simulación Interactiva con Slider:**
     - Control deslizante (*slider*) para `activeUsers` (de 0 a 100+).
     - Controles numéricos para `storageGb` y `apiCalls`.
     - **Proyección Local en Tiempo Real:** El frontend aplica en memoria la misma fórmula de tramos e impuestos ante cualquier movimiento del slider, mostrando el desglose inmediato sin saturar el backend con peticiones.
     - **Ergonomía de Espaciado en Conversión en Vivo (`Live Conversion`):** El bloque visual de conversión multi-divisa aplica espaciado amplio y respirable (`padding: 1rem 1.25rem`, separación vertical de etiquetas con `gap: 0.5rem` e interletreado `letter-spacing: 0.05em`) para evitar el apiñamiento entre el encabezado, el importe total convertido y el tipo de cambio unitario.
     - **Persistencia Bajo Demanda y Feedback:** Solo cuando el usuario comercial pulsa `"Guardar Simulación"` se envía la petición `POST /simulations` para persistir el registro en SQLite. El sistema muestra una notificación accesible inmediata mediante `MatSnackBar` confirmando el guardado exitoso o informando con precisión si ocurrió un error de validación o red.
  4. **Selector de Divisa Dinámico y Armonización en Navbar:**
     - Divisas soportadas: `EUR`, `USD`, `GBP`, `CHF`, `CAD`, `JPY`.
     - Conexión a API pública externa: `https://open.er-api.com/v6/latest/EUR`.
     - Gestión de estados: indicador visual de carga (*loading*), caché en memoria de tasas de cambio y mecanismo de contingencia (*fallback* a EUR) si la API externa falla o no tiene red.
     - **Coherencia Visual con el Selector de Idioma:** En el navbar superior, el selector de moneda (`CurrencySelectorComponent`) cuenta con dimensiones idénticas a las del selector de idioma (`LanguageSelectorComponent`), con esquinas redondeadas estilo píldora (`--roams-radius-md`), padding armónico y un glifo temático de moneda (`<mat-icon>monetization_on</mat-icon>`) complementario al de globo terráqueo (`<mat-icon>language</mat-icon>`).
  5. **Hero Banner Esbelto a Ancho Completo y Visibilidad Above-the-Fold en `/home`:**
     - El contenedor de cabecera `.hero-banner` mantiene su longitud horizontal completa alineada con el contenedor general (`width: 100%; max-width: 1300px`) y una altura esbelta optimizada (`padding: 1.15rem 2rem`), con una ilustración 3D armónica (`max-height: 190px; max-width: 340px; aspect-ratio: 16 / 9`) que aprovecha el espacio vertical sin huecos residuales arriba ni abajo.
     - Esta reducción de más del 55% en espacio vertical garantiza que los elementos más relevantes del dashboard según carga (métricas KPI, tarjetas de tramos de precios y clientes recientes con simulación directa) aparezcan inmediatamente sobre el pliegue (*above the fold*) sin obligar al usuario a hacer scroll, preservando la continuidad visual de anchura con la cuadrícula de tarjetas inferiores.
   6. **Despacho Comercial y Redacción de Email con Notificación Toast (`MatSnackBar`):**
      - Modal corporativo de redacción enriquecida WYSIWYG (`EmailComposerDialogComponent`) para emitir propuestas comerciales personalizadas directamente al backend `POST /emails/send`.
      - **Cierre Inmediato y Feedback Asíncrono no Obstructivo:** Al pulsar *"Enviar email"*, una vez validado y despachado con éxito por el servidor, el diálogo se cierra de forma inmediata (sin tiempos de espera residuales ni banners transitorios dentro del modal).
      - Tras el cierre, se emite una notificación accesible en pantalla mediante `MatSnackBar` (*"Correo enviado con éxito."*) visible durante 4 segundos en la vista principal donde permanece el usuario comercial.

### 3.2 Suite Visual 3D Táctil (Warm Product & Isometric Design) y Política de Anclaje Visual
Para dotar a la plataforma de una identidad visual acogedora, moderna y profesional, alejándose radicalmente tanto de las figuras humanas antropomórficas como de la estética fría, oscura o de neones cibernéticos tipo Tron:
1. **Hero Banner Dashboard (`/home` - `hero-illustration.jpg`):** Composición isométrica 3D de un puesto de trabajo escandinavo bañado por luz matinal natural: portátil moderno con el panel de facturación y analíticas en pantalla, taza cerámica, planta suculenta, tablet y tarjetas *frosted glass* translúcidas con curvas de ingresos y chips de divisas (€, $, £).
2. **Estudio de Simulaciones (`/simulations` - `simulations-illustration.jpg`):** Taller de simulación 3D con mesa de madera clara, tablet interactiva con sliders de precios y barras de comparación por volumen, bloques geométricos físicos en tonos pastel (salvia, coral, ámbar), fichas de descuento (-10%, -20%), planta monstera y paneles flotantes de cristal esmerilado con fórmulas de cálculo.
3. **Catálogo de Clientes Corporativos (`/customers` - `corporate-customer-badge.jpg`):** Maqueta arquitectónica 3D en diorama de una sede corporativa contemporánea y eco-friendly con madera de cedro, grandes ventanales, jardín en la azotea y un maletín ejecutivo de cuero tostado con herrajes dorados.
4. **Despacho Comercial (`/customers/:id` - `email-dispatch-badge.jpg`):** Emblema táctil 3D con un sobre de propuesta comercial de grueso papel texturizado crema con sello lacrado en oro en relieve, documento de propuesta y un avión de papel origami en tono pastel coral ascendiendo con destellos dorados.

**Política Responsive de Anclaje Visual vs. Cero Ruido:**  
En pantallas de escritorio y tablet ($\ge$ 769px), estas ilustraciones proporcionan un anclaje visual inmediato para reconocer la pantalla de un vistazo. En smartphones ($\le$ 768px), las ilustraciones tipo banner de gran tamaño se ocultan de forma automática (`display: none !important;`), erradicando el ruido visual y manteniendo los controles interactivos y tablas directamente visibles *above the fold*.

### 3.3 Micro-interacciones Visuales Duales: Monedas 3D y Clústeres Dinámicos de Usuarios por Tramo
Para plasmar visualmente el impacto del coste por usuario y el ahorro escalonado en las tarjetas de referencia de tramos (en `/simulations` y `/home`):
- **Efecto Cascada y Altura Decreciente de Monedas:** Cada tramo exhibe una montañita física de monedas doradas táctiles que caen secuencialmente una sobre otra (`@keyframes coinDrop`) con un sutil rebote elástico:
  - **Tramo 1 (10,00 € - 0 a 10 usuarios):** Pila más alta con **5 monedas** apiladas, simbolizando el mayor coste unitario por asiento en fases iniciales.
  - **Tramo 2 (8,00 € - 11 a 50 usuarios):** Pila intermedia con **3 monedas**, reflejando el descuento automático acumulativo.
  - **Tramo 3 (5,00 € - Más de 50 usuarios):** Pila baja con **2 monedas**, reflejando la máxima optimización de costes unitarios a gran escala.
- **Clúster Escalonado de Usuarios (Volumen Creciente en Espejo):** Como contrapunto visual al coste unitario, cada tramo incorpora un indicador dinámico de volumen con siluetas de personas (`users-cluster`) que crece a medida que aumenta la escala corporativa:
  - **Tramo 1 (0 a 10 usuarios):** Silueta individual única (`person` x1), representando pequeñas implantaciones o fases piloto iniciales.
  - **Tramo 2 (11 a 50 usuarios):** Equipo mediano superpuesto (`person` x3), simbolizando medianas empresas en expansión.
  - **Tramo 3 (Más de 50 usuarios):** Multitud corporativa masiva (`person` x5), representando despliegues empresariales a gran escala.
  - **Micro-interacción al Hover:** Al interactuar con la tarjeta, las personas se despliegan en abanico (*fan-out* expandiendo el solapamiento de `-7px` a `-3px`) con rebote elástico (`transform: scale(1.06)`), mientras que en el Tramo 1 la figura da un salto de atención (`translateY(-2px) scale(1.12)`).
- **Mantenibilidad y Rendimiento (100% CSS):**
  - Implementado exclusivamente mediante CSS Grid/Flexbox y aceleración por GPU (`transform`, `will-change`), sin librerías JS externas ni coste en runtime.
  - Tokens SSOT en `src/styles/_colors.scss` (`--roams-coin-gold`, `--roams-coin-gold-light`, `--roams-coin-gold-dark`, `--roams-coin-gold-rim`, `--roams-accent-blue`, `--roams-status-success`, `--roams-status-warning`) sin hardcodeo de colores.
  - Respeto a la accesibilidad W3C: marcado con `aria-hidden="true"` y desactivación automática de la animación ante `@media (prefers-reduced-motion: reduce)`.

### 3.4 Contadores Dinámicos Count-Up y Diales de Barrido Radial Conic Clock Sweep en KPIs de `/home`
Para enriquecer la experiencia analítica en el panel ejecutivo comercial:
- **Conteo Ascendente Interpolado (*Count-Up*):** Los indicadores numéricos parten de `0` y ascienden hasta sus valores objetivo mediante Angular Signals y `requestAnimationFrame` con una curva de deceleración cúbica suave (*cubic ease-out*: $1 - (1 - p)^3$) en un intervalo calibrado de 1400 ms:
  - Clientes Registrados: de `0` al total consolidado por la API (`totalCustomers`).
  - Jurisdicciones Fiscales: de `0` a `8` (`supportedCountriesCount`).
  - Tramos de Tarificación: de `0` a `3`.
- **Barrido Radial Cónico (*Conic Clock Sweep*):**
  - Los contenedores de icono se transforman en diales circulares (`border-radius: 50%`) gobernados por `conic-gradient(from 0deg at 50% 50%, ...)`.
  - El gradiente comienza a las 12 en punto (`0deg`) y rota en sentido horario emulando las agujas de un reloj.
  - El fondo base al 10% es cubierto progresivamente por un tono más saturado y oscuro al 26% de opacidad generado con `color-mix(in srgb, var(--kpi-theme-color) 26%, transparent)`.
- **Sincronización Matemática Estricta:** Al derivar tanto el número como el ángulo de giro ($\theta \in [0^\circ, 360^\circ]$) del mismo factor de interpolación $p$, el dial completa su rotación de $360^\circ$ exactamente en el mismo instante en que el contador alcanza su cifra final.
- **Accesibilidad y Rendimiento:** Bypass instantáneo sin animación bajo `prefers-reduced-motion: reduce`, diales marcados con `aria-hidden="true"` y cancelación de frames en `ngOnDestroy`.

---

## 4. Estándar de Gestión de Errores (RFC 7807)

Todas las respuestas con código de estado HTTP $\ge 400$ deben seguir estrictamente el estándar **RFC 7807 Problem Details** (`application/problem+json`).

### Formato Estándar de Error
```json
{
  "type": "https://errors.saas-o-matic.com/400",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid tax identifier 'B1234567X' for country 'ES'.",
  "instance": "/customers",
  "invalidParams": [
    {
      "name": "taxId",
      "reason": "taxId must be a valid Spanish fiscal identifier (DNI/NIE/CIF)."
    }
  ],
  "timestamp": "2026-11-12T10:15:30.000Z"
}
```

### Códigos de Estado Utilizados
- `200 OK`: Consulta o búsqueda exitosa.
- `201 Created`: Cliente o simulación registrada con éxito.
- `400 Bad Request`: Error de validación sintáctica, semántica o fallo en algoritmo fiscal.
- `404 Not Found`: Cliente no encontrado por ID.
- `409 Conflict`: `taxId` ya existente en el sistema.
- `500 Internal Server Error`: Error no controlado del servidor.

### Convención del Miembro `type` (IETF RFC 7807)
- En respuestas originadas por el backend, `type` referencia el código de estado (`https://errors.saas-o-matic.com/${status}`).
- Para incidencias de conectividad de cliente (pérdida de red, timeout, servidor inalcanzable) o errores donde no exista una URI de documentación externa, se prescribe el uso de la URI canónica `'about:blank'`, según estipula la sección 4.2.1 del estándar RFC 7807.

---

## 5. Endpoints de la API REST

Base URL: `http://localhost:3000` (sin prefijo `/api/v1` según especificación del reto).  
Documentación interactiva (Swagger UI): `http://localhost:3000/docs`.

| Método | Ruta | Parámetros Query | Cabeceras de Respuesta | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/customers` | Ninguno | Ninguna | Registra un nuevo cliente corporativo validando su fiscalidad. |
| `GET` | `/customers` | `search` (opcional, string)<br>`country` (opcional, ISO-2)<br>`page` (opcional, entero $\ge 1$)<br>`limit` (opcional, entero $1..100$)<br>`sortBy` (opcional: `companyName`, `createdAt`, `country`, `taxId`)<br>`order` (opcional: `ASC`, `DESC`) | `X-Total-Count`<br>`X-Page`<br>`X-Limit`<br>`X-Total-Pages` | Lista clientes con búsqueda parcial, filtro de jurisdicción fiscal, ordenación SQL multi-criterio y paginación server-side. El cuerpo devuelve el array de clientes para mantener total compatibilidad hacia atrás. |
| `GET` | `/customers/{id}` | Ninguno | Ninguna | Obtiene los datos del cliente corporativo. |
| `GET` | `/simulations` | `customerId` (requerido, UUID) | Ninguna | Lista el historial de simulaciones de un cliente ordenadas descendentemente por fecha. |
| `POST` | `/simulations` | Ninguno | Ninguna | Registra y persiste una simulación calculando el coste por tramos e impuestos. Valida `customerId` compatible con cualquier estándar RFC de UUID (v1-v5 y v7). |
| `POST` | `/emails/send` | Ninguno | Ninguna | Despacha una propuesta comercial o presupuesto por email mediante adaptador transaccional desacoplado con sanitización anti-XSS. |

#### Especificación de Cabeceras de Paginación RFC
Cuando se consulta `GET /customers`, el controlador primario inyecta las siguientes cabeceras HTTP estándar (expuestas en CORS mediante `Access-Control-Expose-Headers`):
- `X-Total-Count`: Número total de registros coincidentes en la base de datos tras aplicar filtros.
- `X-Page`: Número de página devuelta (ej. `1`).
- `X-Limit`: Límite de elementos por página solicitado o predeterminado.
- `X-Total-Pages`: Total de páginas calculadas ($\lceil \text{total} / \text{limit} \rceil$).
- **Cuerpo de Respuesta:** Array JSON `CustomerResponseDto[]` plano. Esta arquitectura desacopla el transporte HTTP de la capa de dominio y evita romper clientes o tests existentes que esperan un array (`Array.isArray(body)`).

---

## 6. Decisiones de Diseño y Consenso Técnico

| Decisión | Criterio Adoptado | Justificación Senior |
| :--- | :--- | :--- |
| **Idioma** | Código en inglés, Docs en español | Código limpio y estándar internacional (`Customer`, `Simulation`, `taxId`), con documentación clara para la evaluación local de Roams. |
| **Plan Elegido** | String libre (`selectedPlan`) | El enunciado oficial indica "Plan Elegido" sin establecer un listado taxativo de enums. |
| **Métricas de Almacenamiento y API** | Registradas con coste base 0 € | El enunciado define el algoritmo de facturación acumulativo únicamente sobre el volumen de usuarios activos, exigiendo guardar las otras métricas para histórico. |
| **Moneda de Persistencia** | Siempre EUR en backend | Evita volatilidad y discrepancias por redondeo en base de datos. La conversión multi-divisa es una responsabilidad de presentación del frontend. |
| **Desacoplamiento Hexagonal** | Dominio puro TypeScript | Entidades de dominio libres de decoradores de NestJS o TypeORM; NestJS reside únicamente en capas de infraestructura y aplicación. |
| **Separación de Bounded Contexts** | `GET /simulations?customerId=` separado | Desacopla `Customers` de `Simulations` evitando dependencias circulares (`forwardRef`). El frontend compone ambos recursos en paralelo. |
| **Evolución de Esquema y Migraciones** | SQLite WAL + Seeder Idempotente (Local) / Expand-Contract (Producción) | Garantiza evaluación sin fricción en local preservando datos persistidos (`nullable`/`default`), y prescribe el ciclo de vida de migraciones DDL formales en producción. |
