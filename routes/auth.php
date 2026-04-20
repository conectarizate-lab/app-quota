<?php
/**
 * Quota — Auth routes
 * POST /auth/register
 * POST /auth/login
 * GET  /auth/me
 * PUT  /auth/me
 *
 * In index.php: $id holds the sub-action ('register', 'login', 'me')
 */

// POST /auth/register
if ($method === 'POST' && $id === 'register') {
    $body    = getBody();
    $nombre  = trim($body['nombre'] ?? '');
    $email   = trim(strtolower($body['email'] ?? ''));
    $pass    = $body['password'] ?? '';
    $empresa = trim($body['empresa'] ?? '');
    $moneda  = in_array($body['moneda_default'] ?? '', ['ARS', 'USD', 'UYU'])
               ? $body['moneda_default'] : 'ARS';

    if (!$nombre || !$email || !$pass) {
        respond(false, null, 'Nombre, email y contraseña son requeridos', 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(false, null, 'Email inválido', 422);
    }
    if (strlen($pass) < 8) {
        respond(false, null, 'La contraseña debe tener al menos 8 caracteres', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        respond(false, null, 'Ya existe una cuenta con ese email', 409);
    }

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    $db->prepare(
        'INSERT INTO usuarios (nombre, email, password_hash, empresa, moneda_default)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([$nombre, $email, $hash, $empresa, $moneda]);

    $userId = (int) $db->lastInsertId();
    $token  = jwt_create([
        'sub'   => $userId,
        'email' => $email,
        'iat'   => time(),
        'exp'   => time() + JWT_EXPIRY,
    ]);

    respond(true, [
        'token'   => $token,
        'usuario' => [
            'id'             => $userId,
            'nombre'         => $nombre,
            'email'          => $email,
            'empresa'        => $empresa,
            'moneda_default' => $moneda,
            'plan'           => 'free',
        ],
    ], '', 201);
}

// POST /auth/login
if ($method === 'POST' && $id === 'login') {
    $body  = getBody();
    $email = trim(strtolower($body['email'] ?? ''));
    $pass  = $body['password'] ?? '';

    if (!$email || !$pass) {
        respond(false, null, 'Email y contraseña son requeridos', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password_hash'])) {
        respond(false, null, 'Credenciales incorrectas', 401);
    }

    $token = jwt_create([
        'sub'   => $user['id'],
        'email' => $user['email'],
        'iat'   => time(),
        'exp'   => time() + JWT_EXPIRY,
    ]);

    respond(true, [
        'token'   => $token,
        'usuario' => [
            'id'             => $user['id'],
            'nombre'         => $user['nombre'],
            'email'          => $user['email'],
            'empresa'        => $user['empresa'],
            'moneda_default' => $user['moneda_default'],
            'plan'           => $user['plan'],
        ],
    ]);
}

// GET /auth/me
if ($method === 'GET' && $id === 'me') {
    $auth = require_auth();
    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT id, nombre, email, empresa, moneda_default, plan, created_at
         FROM usuarios WHERE id = ? AND activo = 1'
    );
    $stmt->execute([$auth['sub']]);
    $user = $stmt->fetch();
    if (!$user) respond(false, null, 'Usuario no encontrado', 404);
    respond(true, ['usuario' => $user]);
}

// PUT /auth/me
if ($method === 'PUT' && $id === 'me') {
    $auth   = require_auth();
    $body   = getBody();
    $db     = getDB();
    $fields = [];
    $params = [];

    if (!empty(trim($body['nombre'] ?? ''))) {
        $fields[] = 'nombre = ?'; $params[] = trim($body['nombre']);
    }
    if (isset($body['empresa'])) {
        $fields[] = 'empresa = ?'; $params[] = trim($body['empresa']);
    }
    if (isset($body['moneda_default']) && in_array($body['moneda_default'], ['ARS', 'USD', 'UYU'])) {
        $fields[] = 'moneda_default = ?'; $params[] = $body['moneda_default'];
    }
    if (!empty($body['password'])) {
        if (strlen($body['password']) < 8) {
            respond(false, null, 'La contraseña debe tener al menos 8 caracteres', 422);
        }
        $fields[] = 'password_hash = ?';
        $params[] = password_hash($body['password'], PASSWORD_BCRYPT);
    }

    if (empty($fields)) respond(false, null, 'No se enviaron campos para actualizar', 422);

    $params[] = $auth['sub'];
    $db->prepare('UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = ?')
       ->execute($params);

    $stmt = $db->prepare(
        'SELECT id, nombre, email, empresa, moneda_default, plan FROM usuarios WHERE id = ?'
    );
    $stmt->execute([$auth['sub']]);
    respond(true, ['usuario' => $stmt->fetch()]);
}

// POST /auth/forgot-password
if ($method === 'POST' && $id === 'forgot-password') {
    $body  = getBody();
    $email = trim(strtolower($body['email'] ?? ''));

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(false, null, 'Email inválido', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM usuarios WHERE email = ? AND activo = 1');
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        $token     = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + 3600);

        $db->prepare(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)'
        )->execute([$email, $token, $expiresAt]);

        $link    = 'https://quota.conectarizate.com/reset-password?token=' . $token;
        $subject = 'Quota — Recuperá tu contraseña';
        $msg     = "Hola,\n\nRecibimos una solicitud para recuperar tu contraseña de Quota.\n\n"
                 . "Hacé clic en este enlace para crear una nueva (válido por 1 hora):\n\n"
                 . $link . "\n\nSi no pediste esto, ignorá este email.\n\nQuota";
        $headers = "From: Quota <noreply@conectarizate.com>\r\nContent-Type: text/plain; charset=UTF-8";

        mail($email, $subject, $msg, $headers);
    }

    respond(true, null, 'Si el email está registrado, recibirás un enlace en breve');
}

// POST /auth/reset-password
if ($method === 'POST' && $id === 'reset-password') {
    $body     = getBody();
    $token    = trim($body['token'] ?? '');
    $password = $body['password'] ?? '';

    if (!$token || strlen($password) < 8) {
        respond(false, null, 'Token y contraseña (mínimo 8 caracteres) son requeridos', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $reset = $stmt->fetch();

    if (!$reset) {
        respond(false, null, 'El enlace es inválido o ya expiró', 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $db->prepare('UPDATE usuarios SET password_hash = ? WHERE email = ?')
       ->execute([$hash, $reset['email']]);
    $db->prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
       ->execute([$reset['id']]);

    respond(true, null, 'Contraseña actualizada correctamente');
}

respond(false, null, 'Método no permitido', 405);
