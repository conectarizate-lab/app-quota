<?php
/**
 * Quota — Database config + shared helpers
 * Update the constants below with your Hostinger MySQL credentials.
 */

define('DB_HOST',    'localhost');
define('DB_NAME',    getenv('DB_NAME') ?: 'your_db_name');
define('DB_USER',    getenv('DB_USER') ?: 'your_db_user');
define('DB_PASS',    getenv('DB_PASS') ?: '');
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'CHANGE_THIS');
define('JWT_EXPIRY', 604800);

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
