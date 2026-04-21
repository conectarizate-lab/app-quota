# Quota — Documentación Técnica Completa
**Versión:** 1.0 — Lista para lanzamiento  
**Fecha:** Abril 2026  
**Producto:** Presupuestador profesional SaaS para emprendedores y PYMEs de Argentina y Uruguay

---

## 1. Descripción del producto

Quota es una aplicación web multi-tenant que permite a emprendedores y pequeñas empresas:
- Gestionar un catálogo de servicios con precios
- Administrar clientes
- Crear y enviar presupuestos profesionales
- Compartir presupuestos por WhatsApp, email o PDF
- Controlar cobros y pagos con recordatorios
- Ver métricas de actividad en un dashboard

Cada usuario tiene sus datos completamente aislados. No hay datos compartidos entre cuentas.

---

## 2. Stack tecnológico

| Capa | Tecnología | Detalle |
|---|---|---|
| Frontend | React 18 | SPA (Single Page Application) |
| Build tool | Vite | Compilación y bundling del frontend |
| Router frontend | React Router v6 | Navegación client-side |
| HTTP client | Axios | Llamadas a la API REST |
| Estilos | CSS Modules | Estilos scoped por componente, responsive mobile |
| PDF | jsPDF + html2canvas | Generación de PDF en el navegador |
| Backend | PHP 8.1+ | API REST pura, sin framework |
| Base de datos | MySQL 8 | Relacional, hosted en Hostinger |
| Autenticación | JWT HS256 | Implementado en PHP puro con `hash_hmac` |
| Hosting | Hostinger Business | PHP + MySQL incluidos |
| Deploy | GitHub → Hostinger Git Deploy | Push a main → click "Implementar" |

> **Sin Composer ni dependencias externas en PHP.** JWT implementado con `hash_hmac('sha256', ...)`. No hay `vendor/`, no hay `composer.json`.

---

## 3. Arquitectura general

```
quota.conectarizate.com/
├── .htaccess           ← Apache: CORS + routing de API a index.php
├── index.php           ← Router principal PHP: distribuye a routes/
├── index.html          ← Build del frontend React (SPA entry point)
├── assets/             ← JS/CSS compilados por Vite
├── config/
│   ├── db.php          ← PDO + helpers respond() / getBody()
│   └── db.local.php    ← Credenciales reales (NO en git, manual en servidor)
├── middleware/
│   └── auth.php        ← jwt_create(), jwt_decode(), require_auth()
├── routes/
│   ├── auth.php        ← register, login, me, forgot-password, reset-password
│   ├── servicios.php   ← CRUD de servicios (soft delete)
│   ├── clientes.php    ← CRUD de clientes
│   ├── presupuestos.php← CRUD + cambio de estado + ítems
│   └── vencimientos.php← CRUD + alertas + historial de recurrentes
├── setup.sql           ← Script completo para crear todas las tablas
└── test-db.php         ← Diagnóstico de conexión DB (puede eliminarse)
```

### Flujo de una request HTTP

1. Apache recibe la request
2. `.htaccess` evalúa si es una ruta de API (`auth|servicios|clientes|presupuestos|vencimientos`) → la reescribe a `index.php?_path=ruta/subruta`
3. Si NO es ruta de API → sirve `index.html` (SPA fallback para React Router)
4. `index.php` lee `$_GET['_path']`, extrae `$resource`, `$id`, `$action` y delega al archivo de rutas correspondiente
5. El archivo de rutas llama a `require_auth()` si aplica, ejecuta la lógica y responde con `respond()`

### Desarrollo local

El frontend corre con `npm run dev` apuntando a la API en producción via `VITE_API_URL`. No se necesita PHP local. Los archivos PHP se editan localmente, se pushean a GitHub y Hostinger los despliega automáticamente al hacer clic en "Implementar".

---

## 4. Base de datos

**Motor:** MySQL 8  
**Host:** localhost (Hostinger)  
**Charset:** utf8mb4 / utf8mb4_unicode_ci

### Tabla: `usuarios`
```sql
id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
nombre          VARCHAR(120) NOT NULL
email           VARCHAR(200) NOT NULL UNIQUE
password_hash   VARCHAR(255) NOT NULL        -- bcrypt
empresa         VARCHAR(120) DEFAULT ''
moneda_default  ENUM('ARS','USD','UYU') DEFAULT 'ARS'
plan            VARCHAR(30) DEFAULT 'free'
activo          TINYINT(1) DEFAULT 1
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Tabla: `servicios`
```sql
id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
usuario_id  INT UNSIGNED NOT NULL → FK usuarios(id) CASCADE
nombre      VARCHAR(200) NOT NULL
descripcion TEXT
precio      DECIMAL(12,2) DEFAULT 0.00
moneda      ENUM('ARS','USD','UYU') DEFAULT 'ARS'
categoria   VARCHAR(100) DEFAULT ''
activo      TINYINT(1) DEFAULT 1      -- soft delete
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Tabla: `clientes`
```sql
id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
usuario_id  INT UNSIGNED NOT NULL → FK usuarios(id) CASCADE
nombre      VARCHAR(200) NOT NULL
email       VARCHAR(200) DEFAULT ''
whatsapp    VARCHAR(50) DEFAULT ''
empresa     VARCHAR(150) DEFAULT ''
notas       TEXT
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Tabla: `presupuestos`
```sql
id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
usuario_id        INT UNSIGNED NOT NULL → FK usuarios(id) CASCADE
cliente_id        INT UNSIGNED NULL → FK clientes(id) SET NULL
numero            VARCHAR(10) NOT NULL           -- '001', '002', ...
estado            ENUM('borrador','enviado','aceptado','rechazado','vencido') DEFAULT 'borrador'
descuento_pct     DECIMAL(5,2) DEFAULT 0.00
subtotal          DECIMAL(12,2) DEFAULT 0.00
total             DECIMAL(12,2) DEFAULT 0.00
moneda            ENUM('ARS','USD','UYU') DEFAULT 'ARS'
nota_cliente      TEXT
fecha_emision     DATE NOT NULL
fecha_vencimiento DATE NULL
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Tabla: `presupuesto_items`
```sql
id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
presupuesto_id  INT UNSIGNED NOT NULL → FK presupuestos(id) CASCADE
servicio_id     INT UNSIGNED NULL → FK servicios(id) SET NULL
nombre          VARCHAR(200) NOT NULL
descripcion     TEXT
precio          DECIMAL(12,2) DEFAULT 0.00
cantidad        SMALLINT UNSIGNED DEFAULT 1
subtotal        DECIMAL(12,2) DEFAULT 0.00    -- precio × cantidad (calculado en backend)
```

### Tabla: `password_resets`
```sql
id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
email       VARCHAR(255) NOT NULL
token       VARCHAR(64) NOT NULL UNIQUE      -- bin2hex(random_bytes(32))
expires_at  DATETIME NOT NULL                -- 1 hora de validez
used        TINYINT(1) DEFAULT 0
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Tabla: `vencimientos`
```sql
id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
usuario_id        INT UNSIGNED NOT NULL → FK usuarios(id) CASCADE
tipo              ENUM('cobro','pago') NOT NULL
concepto          VARCHAR(200) NOT NULL
monto             DECIMAL(12,2) NULL
moneda            ENUM('ARS','USD','UYU') DEFAULT 'ARS'
cliente_id        INT UNSIGNED NULL → FK clientes(id) SET NULL
fecha_vencimiento DATE NOT NULL
recurrencia       ENUM('unico','semanal','mensual','anual') DEFAULT 'unico'
estado            ENUM('pendiente','recordatorio_enviado','cobrado','pagado','vencido') DEFAULT 'pendiente'
notas             TEXT
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### Tabla: `vencimientos_historial`
```sql
id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
vencimiento_id  INT UNSIGNED NOT NULL → FK vencimientos(id) CASCADE
fecha_pago      DATE NOT NULL
monto_pagado    DECIMAL(12,2) NULL
notas           TEXT
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 5. Autenticación

- **Tipo:** JWT HS256 firmado con `hash_hmac('sha256', ...)`
- **Sin librerías:** implementación propia en `middleware/auth.php`
- **Payload del token:** `{ sub: usuario_id, email, iat, exp }`
- **Expiración:** 7 días (604800 segundos), configurable via `JWT_EXPIRY`
- **Almacenamiento frontend:** `localStorage`
- **Header:** `Authorization: Bearer {token}`
- **Recuperación de contraseña:** email con token único de 64 chars, válido 1 hora, marcado como `used` al usarse. Email enviado con `mail()` de PHP.

---

## 6. API REST — Endpoints completos

**Base URL:** `https://quota.conectarizate.com`  
**Formato de respuesta:** `{ "success": true/false, "data": {} }` o `{ "success": false, "message": "..." }`

### Auth (`/auth`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | /auth/register | No | Registro. Body: `nombre, email, password, empresa, moneda_default` |
| POST | /auth/login | No | Login. Body: `email, password`. Devuelve token + usuario |
| GET | /auth/me | Sí | Datos del usuario autenticado |
| PUT | /auth/me | Sí | Editar perfil: nombre, empresa, moneda_default, password |
| POST | /auth/forgot-password | No | Envía email con link de reset. Body: `email` |
| POST | /auth/reset-password | No | Cambia contraseña. Body: `token, password` |

### Servicios (`/servicios`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /servicios | Sí | Listar servicios activos del usuario |
| POST | /servicios | Sí | Crear servicio. Body: `nombre, descripcion, precio, moneda, categoria` |
| GET | /servicios/{id} | Sí | Ver servicio |
| PUT | /servicios/{id} | Sí | Editar servicio |
| DELETE | /servicios/{id} | Sí | Soft delete (`activo = 0`) |

### Clientes (`/clientes`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /clientes | Sí | Listar clientes del usuario |
| POST | /clientes | Sí | Crear cliente. Body: `nombre, email, whatsapp, empresa, notas` |
| GET | /clientes/{id} | Sí | Ver cliente |
| PUT | /clientes/{id} | Sí | Editar cliente |
| DELETE | /clientes/{id} | Sí | Eliminar cliente (hard delete) |

### Presupuestos (`/presupuestos`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /presupuestos | Sí | Listar presupuestos. Filtros: `?estado=`, `?cliente_id=`, `?desde=`, `?hasta=` |
| POST | /presupuestos | Sí | Crear presupuesto con ítems |
| GET | /presupuestos/{id} | Sí | Ver presupuesto con ítems |
| PUT | /presupuestos/{id} | Sí | Editar presupuesto y reemplazar ítems |
| DELETE | /presupuestos/{id} | Sí | Eliminar presupuesto (hard delete) |
| PATCH | /presupuestos/{id}/estado | Sí | Cambiar estado. Body: `{ "estado": "..." }` |

### Vencimientos (`/vencimientos`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /vencimientos | Sí | Listar. Filtros: `?tipo=cobro\|pago`, `?estado=`, `?cliente_id=`, `?desde=`, `?hasta=` |
| POST | /vencimientos | Sí | Crear vencimiento |
| GET | /vencimientos/alertas | Sí | Vencidos + próximos 3/7 días + totales pendientes |
| GET | /vencimientos/{id} | Sí | Ver vencimiento con historial |
| PUT | /vencimientos/{id} | Sí | Editar vencimiento |
| PATCH | /vencimientos/{id}/estado | Sí | Cambiar estado. Si es recurrente y se marca cobrado/pagado: crea el próximo automáticamente |
| DELETE | /vencimientos/{id} | Sí | Eliminar vencimiento |

---

## 7. Reglas de negocio

### Presupuestos
- **Número de presupuesto:** `MAX(numero) + 1` por usuario, con padding `001`, `002`, etc.
- **Subtotal de ítem:** `precio × cantidad`. El backend siempre recalcula, nunca confía en el frontend.
- **Total del presupuesto:** `subtotal - (subtotal × descuento_pct / 100)`. Ídem.
- **Estado inicial:** siempre `borrador`.
- **Aislamiento:** toda query filtra por `usuario_id` del JWT.

### Servicios
- **Soft delete:** `activo = 0`. Nunca se eliminan físicamente para preservar integridad referencial con presupuesto_items.

### Vencimientos
- **Recurrentes:** al marcar como `cobrado` o `pagado`, el sistema inserta una fila en `vencimientos_historial` y crea automáticamente el próximo vencimiento con fecha calculada:
  - `semanal`: +7 días
  - `mensual`: +1 mes (mismo día)
  - `anual`: +1 año (mismo día)
- **Nivel de alerta (calculado en frontend):**
  - Rojo: fecha_vencimiento < hoy (vencido)
  - Naranja: vence en 1–3 días
  - Amarillo: vence en 4–7 días
  - Gris: vence en más de 7 días
- **Recordatorio:** al copiar el mensaje de WhatsApp, el estado pasa automáticamente a `recordatorio_enviado`.
- **Mensajes de recordatorio:** generados en el frontend, la app NO envía mensajes automáticamente. El usuario copia y pega.

---

## 8. Estructura del frontend

```
frontend/src/
├── api/
│   ├── axios.js            ← Instancia Axios con baseURL y token en header
│   ├── auth.js             ← register, login, getMe, updateMe, forgotPassword, resetPassword
│   ├── servicios.js        ← getServicios, createServicio, updateServicio, deleteServicio
│   ├── clientes.js         ← getClientes, createCliente, updateCliente, deleteCliente
│   ├── presupuestos.js     ← getPresupuestos, createPresupuesto, updatePresupuesto, patchEstado, etc.
│   └── vencimientos.js     ← getVencimientos, createVencimiento, patchEstado, getAlertas, etc.
├── components/
│   ├── Layout/
│   │   ├── Layout.jsx      ← Wrapper con sidebar + header + outlet
│   │   ├── Sidebar.jsx     ← Navegación lateral con links y logout
│   │   └── Header.jsx      ← Header superior
│   └── Vencimientos/
│       ├── AlertasWidget.jsx       ← Widget compacto para Dashboard
│       ├── VencimientoCard.jsx     ← Tarjeta individual con badges y acciones
│       ├── FormVencimiento.jsx     ← Modal de alta y edición
│       └── MensajeRecordatorio.jsx ← Modal con texto generado para copiar
├── context/
│   └── AuthContext.jsx     ← Proveedor de autenticación global
├── hooks/
│   └── useAuth.js          ← Hook para acceder al contexto de auth
├── pages/
│   ├── Login.jsx           ← Formulario de login
│   ├── Register.jsx        ← Formulario de registro
│   ├── ForgotPassword.jsx  ← Solicitud de reset de contraseña
│   ├── ResetPassword.jsx   ← Formulario de nueva contraseña (con token en URL)
│   ├── Dashboard.jsx       ← Métricas + últimos presupuestos + widget de vencimientos
│   ├── Servicios.jsx       ← ABM de servicios
│   ├── Clientes.jsx        ← ABM de clientes
│   ├── NuevoPresupuesto.jsx    ← Wizard de creación de presupuesto
│   ├── EditarPresupuesto.jsx   ← Edición de presupuesto existente
│   ├── VerPresupuesto.jsx      ← Vista detalle + acciones (PDF, WhatsApp, email)
│   ├── Historial.jsx           ← Listado filtrable de presupuestos
│   ├── Configuracion.jsx       ← Edición de perfil y preferencias
│   └── Vencimientos.jsx        ← Módulo de cobros y pagos con tabs y filtros
└── utils/
    ├── formatCurrency.js       ← Formateo de montos según moneda
    ├── generatePDF.js          ← Generación de PDF con jsPDF + html2canvas
    ├── presupuestoTexto.js     ← Genera texto para WhatsApp/email
    └── vencimientoAlertas.js   ← Calcula nivel de alerta, días para vencer, genera mensajes
```

### Rutas del frontend

| Ruta | Componente | Auth |
|---|---|---|
| /login | Login | Pública |
| /register | Register | Pública |
| /forgot-password | ForgotPassword | Pública |
| /reset-password?token= | ResetPassword | Pública |
| /dashboard | Dashboard | Privada |
| /servicios | Servicios | Privada |
| /clientes | Clientes | Privada |
| /vencimientos | Vencimientos | Privada |
| /presupuestos/nuevo | NuevoPresupuesto | Privada |
| /presupuestos/:id | VerPresupuesto | Privada |
| /presupuestos/:id/editar | EditarPresupuesto | Privada |
| /historial | Historial | Privada |
| /configuracion | Configuracion | Privada |

---

## 9. Infraestructura y deploy

| Concepto | Detalle |
|---|---|
| Dominio | `quota.conectarizate.com` |
| Hosting | Hostinger Business |
| Repositorio | `https://github.com/conectarizate-lab/app-quota` (público) |
| Deploy | Manual: push a main → click "Implementar" en Hostinger |
| Base de datos | `u568811695_quota` en MySQL de Hostinger |
| Credenciales DB | En `config/db.local.php` — fuera del repositorio, creado manualmente en servidor |
| JWT_SECRET | Cadena aleatoria de 64+ caracteres, definida en `db.local.php` |
| Email | PHP `mail()` nativo de Hostinger — usado para recuperación de contraseña |

### Variables de entorno

**Frontend** (`frontend/.env`, no en git):
```
VITE_API_URL=https://quota.conectarizate.com
```

**Backend** (`config/db.local.php`, no en git):
```php
define('DB_HOST',    'localhost');
define('DB_NAME',    'u568811695_quota');
define('DB_USER',    'u568811695_quota');
define('DB_PASS',    '...');
define('JWT_SECRET', '...64+ chars...');
define('JWT_EXPIRY', 604800);
```

---

## 10. Funcionalidades implementadas (MVP completo)

### UI / Responsive
- [x] Sidebar responsive: oculto en mobile, se abre con botón hamburguesa (☰) en el header, overlay oscuro al abrirse, se cierra al navegar o tocar fuera
- [x] Breakpoint mobile: ≤768px

### Autenticación
- [x] Registro con email y contraseña
- [x] Login con JWT (7 días de sesión)
- [x] Recuperación de contraseña por email con token de un uso
- [x] Edición de perfil (nombre, empresa, moneda, contraseña)

### Catálogo de servicios
- [x] Alta, edición y baja lógica (soft delete) de servicios
- [x] Precio, moneda y categoría por servicio
- [x] Los servicios eliminados se conservan en presupuestos existentes

### Clientes
- [x] Alta, edición y eliminación de clientes
- [x] Campos: nombre, email, WhatsApp, empresa, notas

### Presupuestos
- [x] Creación con múltiples ítems (desde catálogo o libres)
- [x] Numeración automática por usuario (001, 002...)
- [x] Descuento porcentual
- [x] Cálculo automático de subtotales y total (en backend)
- [x] Estados: borrador → enviado → aceptado / rechazado / vencido
- [x] Nota para el cliente
- [x] Fecha de emisión y vencimiento
- [x] Vista de detalle con acciones
- [x] Generación de PDF en el navegador
- [x] Texto listo para WhatsApp/email
- [x] Historial filtrable por estado, cliente y fecha

### Vencimientos (cobros y pagos)
- [x] Registro de cobros (lo que le deben al usuario) y pagos (lo que el usuario debe pagar)
- [x] Asociación de cobros a clientes
- [x] Monto, moneda, fecha de vencimiento y notas
- [x] Recurrencia: único, semanal, mensual, anual
- [x] Al marcar recurrente como cobrado/pagado: crea el próximo automáticamente y guarda historial
- [x] Filtros por estado y rango de fechas
- [x] Tabs separados para cobros y pagos
- [x] Alertas visuales por proximidad (rojo/naranja/amarillo/gris)
- [x] Generador de mensajes de recordatorio para WhatsApp
- [x] Widget de alertas en el Dashboard (vencidos + próximos 3 días)
- [x] Total pendiente por moneda

### Dashboard
- [x] Total de presupuestos, aceptados, pendientes, emitidos este mes
- [x] Monto facturado este mes por moneda
- [x] Últimos 5 presupuestos
- [x] Widget de alertas de vencimientos

---

## 11. Lo que NO está en el MVP (V2)

- Integración con Mercado Pago
- PDF con logo del usuario
- Enlace público de presupuesto (sin login)
- Recordatorios automáticos por email (cron jobs)
- Plantillas por rubro
- Panel de administración
- Multi-idioma
- Roles de equipo (múltiples usuarios por cuenta)
- Integración directa con WhatsApp Business API

---

## 12. Consideraciones de seguridad

- Todas las queries usan PDO con prepared statements (sin SQL injection)
- Toda query filtra por `usuario_id` del JWT (aislamiento estricto entre usuarios)
- Las contraseñas se hashean con `password_hash(..., PASSWORD_BCRYPT)`
- Los tokens JWT se verifican con `hash_equals()` para evitar timing attacks
- Los tokens de recuperación de contraseña son de un solo uso y expiran en 1 hora
- Las credenciales de DB están fuera del repositorio git (`db.local.php` en `.gitignore`)
- CORS configurado en `.htaccess` para permitir el frontend en el mismo dominio

---

*Quota v1.0 — Conectarizate — Abril 2026*
