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
2. **Búsqueda flexible:** El sistema debe permitir búsqueda parcial insensible a mayúsculas/minúsculas (`ILIKE` o `LOWER() LIKE %search%`) tanto por `companyName` como por `taxId`.

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

#### B. Tabla de Impuestos por Jurisdicción
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

### 3.1 Arquitectura de Componentes
- **Tecnología:** Angular 21 (Standalone Components, Signals reactivos para estado local).
- **Vistas y Componentes Clave:**
  1. **Buscador y Dashboard:** Campo de búsqueda conectado a `GET /customers?search=...`, mostrando clientes coincidentes en tarjetas interactivas.
  2. **Detalle del Cliente (Cards Responsive):**
     - Muestra datos fiscales, plan y país del cliente corporativo.
     - Historial con sus simulaciones guardadas ordenadas cronológicamente (`createdAt desc`).
  3. **Formulario de Simulación Interactiva con Slider:**
     - Control deslizante (*slider*) para `activeUsers` (de 0 a 100+).
     - Controles numéricos para `storageGb` y `apiCalls`.
     - **Proyección Local en Tiempo Real:** El frontend aplica en memoria la misma fórmula de tramos e impuestos ante cualquier movimiento del slider, mostrando el desglose inmediato sin saturar el backend con peticiones.
     - **Persistencia Bajo Demanda:** Solo cuando el usuario comercial pulsa `"Guardar Simulación"` se envía la petición `POST /simulations` para persistir el registro en la base de datos.
  4. **Selector de Divisa Dinámico:**
     - Divisas soportadas: `EUR`, `USD`, `GBP`, `CHF`, `CAD`, `JPY`.
     - Conexión a API pública externa: `https://open.er-api.com/v6/latest/EUR`.
     - Gestión de estados: indicador visual de carga (*loading*), caché en memoria de tasas de cambio y mecanismo de contingencia (*fallback* a EUR) si la API externa falla o no tiene red.

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

---

## 5. Endpoints de la API REST

Base URL: `http://localhost:3000` (sin prefijo `/api/v1` según especificación del reto).  
Documentación interactiva (Swagger UI): `http://localhost:3000/docs`.

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/customers` | Registra un nuevo cliente corporativo validando su fiscalidad. |
| `GET` | `/customers?search=` | Lista clientes con filtro opcional insensible a mayúsculas por nombre o taxId. |
| `GET` | `/customers/{id}` | Obtiene los datos del cliente corporativo. |
| `GET` | `/simulations?customerId=` | Lista el historial de simulaciones de un cliente ordenadas descendentemente por fecha. |
| `POST` | `/simulations` | Registra y persiste una simulación calculando el coste por tramos e impuestos. |

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
