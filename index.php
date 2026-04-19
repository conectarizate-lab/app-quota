<?php
/**
 * Quota — API router
 * Lives at public_html/api/index.php on Hostinger.
 * All requests are rewritten here by .htaccess.
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/middleware/auth.php';

// ── Parse request ─────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Strip the base path (/api) so we get just the route part
$scriptDir = rtrim(str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']), '/');
$uri       = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path      = trim(substr($uri, strlen($scriptDir)), '/');
$segments  = $path !== '' ? explode('/', $path) : [];

// $resource = 'auth' | 'servicios' | 'clientes' | 'presupuestos'
// $id       = second segment (numeric id or sub-action like 'register')
// $action   = third segment (e.g. 'estado')
$resource = $segments[0] ?? '';
$id       = (isset($segments[1]) && $segments[1] !== '') ? $segments[1] : null;
$action   = (isset($segments[2]) && $segments[2] !== '') ? $segments[2] : null;

// ── Dispatch ──────────────────────────────────────────────────────────────────
switch ($resource) {
    case 'auth':
        require __DIR__ . '/routes/auth.php';
        break;
    case 'servicios':
        require __DIR__ . '/routes/servicios.php';
        break;
    case 'clientes':
        require __DIR__ . '/routes/clientes.php';
        break;
    case 'presupuestos':
        require __DIR__ . '/routes/presupuestos.php';
        break;
    default:
        respond(false, null, 'Ruta no encontrada', 404);
}
