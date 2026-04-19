# Quota — CLAUDE.md
## Contexto de proyecto para sesiones con Claude

---

## Descripción

**Quota** es una app web SaaS para generar presupuestos profesionales, dirigida a emprendedores y PYMEs de Argentina y Uruguay. Los usuarios cargan su catálogo de servicios y arman presupuestos que comparten por WhatsApp, email o PDF.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Axios, CSS Modules |
| Backend | PHP 8.1+ API REST pura (sin framework), MySQL 8 |
| Auth | JWT HS256 en PHP puro (sin Composer, sin dependencias) |
| PDF | jsPDF + html2canvas (generado en el navegador) |
| Hosting | Hostinger Business (PHP + MySQL incluidos) |

> **Sin Composer**: JWT implementado con `hash_hmac('sha256', ...)`. No hay `vendor/` ni `composer.json`.

---

## Arquitectura

- El **frontend** (React) compila a estáticos y se sube a `public_html/` en Hostinger.
- El **backend** (PHP) vive en `public_html/api/` y expone una API REST.
- El frontend consume la API con Axios, mandando `Authorization: Bearer {token}`.
- **Desarrollo local**: React corre con `npm run dev` apuntando a la API en Hostinger via `VITE_API_URL`. No se necesita PHP local.
- **Deploy**: push a GitHub → Hostinger auto-despliega los archivos PHP.

---

## Estructura de carpetas

```
App Quota/
├── CLAUDE.md
├── frontend/                    ← npm run dev
│   ├── src/
│   │   ├── api/                 ← axios.js + auth/servicios/clientes/presupuestos.js
│   │   ├── components/
│   │   │   ├── Layout/          ← Layout.jsx, Sidebar.jsx, Header.jsx
│   │   │   ├── UI/              ← Button, Input, Modal, Badge, EmptyState
│   │   │   ├── Presupuesto/     ← ItemRow, TotalesBox, PreviewTexto
│   │   │   └── Servicio/        ← ServicioCard
│   │   ├── context/             ← AuthContext.jsx
│   │   ├── hooks/               ← useAuth.js
│   │   ├── pages/               ← Una página por ruta
│   │   └── utils/               ← formatCurrency, generatePDF, presupuestoTexto
│   ├── .env                     ← VITE_API_URL (no subir a git)
│   └── .env.example
└── backend/                     ← Subir a public_html/api/ en Hostinger
    ├── config/db.php            ← PDO + constantes JWT + helpers respond()/getBody()
    ├── middleware/auth.php      ← jwt_create(), jwt_decode(), require_auth()
    ├── index.php                ← Router: METHOD + PATH → routes/
    ├── routes/
    │   ├── auth.php             ← register, login, me
    │   ├── servicios.php        ← CRUD (soft delete)
    │   ├── clientes.php         ← CRUD
    │   └── presupuestos.php     ← CRUD + PATCH /estado
    └── .htaccess                ← CORS + routing a index.php
```

---

## Base de datos (MySQL en Hostinger — phpMyAdmin)

```
usuarios        — id, nombre, email, password_hash, empresa, moneda_default, plan, activo
servicios       — id, usuario_id, nombre, descripcion, precio, moneda, categoria, activo
clientes        — id, usuario_id, nombre, email, whatsapp, empresa, notas
presupuestos    — id, usuario_id, cliente_id, numero, estado, descuento_pct, subtotal, total, moneda, nota_cliente, fecha_emision, fecha_vencimiento
presupuesto_items — id, presupuesto_id, servicio_id, nombre, descripcion, precio, cantidad, subtotal
```

---

## Reglas de negocio

1. **Aislamiento**: toda query filtra por `usuario_id` del JWT. Nunca mezclar datos de usuarios.
2. **Número de presupuesto**: `MAX(numero) + 1` por usuario, con padding `001`, `002`...
3. **Subtotal ítem**: `precio × cantidad`. El backend recalcula siempre, no confiar en el frontend.
4. **Total**: `subtotal - (subtotal × descuento_pct / 100)`. Ídem.
5. **Estado inicial**: siempre `borrador`.
6. **Soft delete servicios**: `activo = 0`. Nunca borrar físicamente.
7. **Delete real**: clientes y presupuestos se borran con `DELETE`.

---

## API REST

Base URL: `https://[subdominio]/api`

| Método | Ruta | Auth |
|---|---|---|
| POST | /auth/register | No |
| POST | /auth/login | No |
| GET/PUT | /auth/me | Sí |
| GET/POST | /servicios | Sí |
| GET/PUT/DELETE | /servicios/{id} | Sí |
| GET/POST | /clientes | Sí |
| GET/PUT/DELETE | /clientes/{id} | Sí |
| GET/POST | /presupuestos | Sí |
| GET/PUT/DELETE | /presupuestos/{id} | Sí |
| PATCH | /presupuestos/{id}/estado | Sí |

---

## Variables de entorno

**Frontend** — `frontend/.env`:
```
VITE_API_URL=https://[subdominio].hostinger.com/api
```

**Backend** — `backend/config/db.php` (editar directamente, no hay .env en PHP):
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_quota');   // del panel Hostinger
define('DB_USER', 'u123456789_admin');
define('DB_PASS', 'tu_password');
define('JWT_SECRET', '...64+ chars aleatorios...');
define('JWT_EXPIRY', 604800);            // 7 días
```

---

## Workflow de desarrollo

1. Clonar repo localmente
2. `cd frontend && npm install && npm run dev`
3. Crear `frontend/.env` con la URL de la API en Hostinger
4. Editar PHP localmente → push a GitHub → Hostinger despliega automáticamente
5. Para producción: `npm run build` → subir `dist/` a `public_html/`

---

## Estado del proyecto

### Frontend — 100% implementado
- [x] CLAUDE.md
- [x] Backend: config, middleware, router, rutas completas (auth/servicios/clientes/presupuestos)
- [x] Frontend: package.json, vite.config, main, App, AuthContext, hooks
- [x] Frontend API: axios, auth, servicios, clientes, presupuestos
- [x] Layout: Sidebar, Header, Layout
- [x] Páginas: Login, Register
- [x] Páginas: Dashboard, Servicios, Clientes
- [x] Páginas: NuevoPresupuesto, EditarPresupuesto, VerPresupuesto
- [x] Páginas: Historial, Configuracion
- [x] Utils: formatCurrency, generatePDF, presupuestoTexto
- [x] backend/setup.sql — script completo para crear las 5 tablas en MySQL

### Pendiente — Deploy
- [ ] Crear base de datos en Hostinger y ejecutar `backend/setup.sql` en phpMyAdmin
- [ ] Completar `backend/config/db.php` con credenciales reales (DB_HOST, DB_NAME, DB_USER, DB_PASS, JWT_SECRET)
- [ ] Configurar subdominio en Hostinger + auto-deploy desde GitHub
- [ ] Crear `frontend/.env` con `VITE_API_URL=https://[subdominio].hostinger.com/api`
- [ ] `npm run build` en frontend → subir `dist/` a `public_html/`
- [ ] Probar flujo completo: registro → servicios → clientes → presupuesto → PDF/WhatsApp

### Pendiente — Bugs / pulido (detectar al probar)
- [ ] Sin probar todavía — primera prueba real pendiente
- [ ] jsPDF no está en package.json — verificar si está instalado (`npm list jspdf`)

---

## MVP incluye / excluye

**Incluido**: auth JWT, catálogo de servicios, clientes, presupuestos con ítems, cálculo automático, cambio de estado, texto para WhatsApp/email, PDF básico, historial con filtros, dashboard con métricas.

**V2**: Mercado Pago, PDF con logo, enlace público, recordatorios por email, plantillas por rubro, panel admin.
