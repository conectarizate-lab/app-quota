<?php
/**
 * Quota — Database config + shared helpers
 * Update the constants below with your Hostinger MySQL credentials.
 */

if (!file_exists(__DIR__ . '/db.local.php')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Falta config/db.local.php con las credenciales']);
    exit;
}
require __DIR__ . '/db.local.php';

/**
 * Returns a singleton PDO connection.
 */
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

/**
 * Sends a JSON response and exits.
 */
function respond(bool $success, mixed $data = null, string $message = '', int $status = 200): void
{
    http_response_code($status);
    $body = ['success' => $success];
    if ($success) {
        $body['data'] = $data;
    } else {
        $body['message'] = $message;
        if ($data !== null) $body['data'] = $data;
    }
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Parses the JSON request body.
 */
function getBody(): array
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
