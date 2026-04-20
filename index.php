<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$path     = trim($_GET['_path'] ?? parse_url($_SERVER['REDIRECT_URL'] ?? $_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
unset($_GET['_path']);
$segments = $path !== '' ? explode('/', $path) : [];

$resource = $segments[0] ?? '';
$id       = (isset($segments[1]) && $segments[1] !== '') ? $segments[1] : null;
$action   = (isset($segments[2]) && $segments[2] !== '') ? $segments[2] : null;

$apiRoutes = ['auth', 'servicios', 'clientes', 'presupuestos'];

if (!in_array($resource, $apiRoutes)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
    exit;
}

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
}
