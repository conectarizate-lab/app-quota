<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

if (!file_exists(__DIR__ . '/config/db.local.php')) {
    echo json_encode(['error' => 'db.local.php no existe']);
    exit;
}

require __DIR__ . '/config/db.local.php';

echo json_encode([
    'DB_NAME' => defined('DB_NAME') ? DB_NAME : 'NO DEFINIDO',
    'DB_USER' => defined('DB_USER') ? DB_USER : 'NO DEFINIDO',
    'DB_PASS_length' => defined('DB_PASS') ? strlen(DB_PASS) : 0,
]);

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo json_encode(['status' => 'OK — conexión exitosa']);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
