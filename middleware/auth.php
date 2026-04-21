<?php
/**
 * Quota — JWT middleware (pure PHP, no Composer required)
 * HS256 using PHP's built-in hash_hmac — no external dependencies.
 */

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Creates a signed JWT token.
 */
function jwt_create(array $payload): string
{
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

/**
 * Verifies and decodes a JWT. Returns payload array or null if invalid/expired.
 */
function jwt_decode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));

    if (!hash_equals($expected, $sig)) return null;

    $data = json_decode(base64url_decode($payload), true);
    if (!is_array($data)) return null;
    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

/**
 * Validates Authorization header, checks trial expiration, sets globals.
 * Returns JWT payload or exits with 401.
 */
function require_auth(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        respond(false, null, 'Token requerido', 401);
    }
    $payload = jwt_decode(trim($m[1]));
    if (!$payload) {
        respond(false, null, 'Token inválido o expirado', 401);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT plan, trial_expira_en, rol FROM usuarios WHERE id = ? AND activo = 1');
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();

    if (!$user) {
        respond(false, null, 'Usuario no encontrado', 401);
    }

    if (
        $user['plan'] === 'pro' &&
        $user['trial_expira_en'] !== null &&
        strtotime($user['trial_expira_en']) < time()
    ) {
        $db->prepare('UPDATE usuarios SET plan = ? WHERE id = ?')->execute(['free', $payload['sub']]);
        $user['plan'] = 'free';
    }

    $GLOBALS['current_plan'] = $user['plan'];
    $GLOBALS['current_rol']  = $user['rol'] ?? 'user';

    return $payload;
}
