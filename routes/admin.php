<?php
/**
 * Quota — Admin routes (solo rol=admin)
 * GET   /admin      — listar todos los usuarios con info de plan
 * PATCH /admin/{id} — actualizar plan/trial de un usuario
 */

$auth = require_auth();
if (($GLOBALS['current_rol'] ?? 'user') !== 'admin') {
    respond(false, null, 'Acceso denegado', 403);
}

$db = getDB();

// GET /admin
if ($method === 'GET' && !$id) {
    $stmt = $db->query(
        'SELECT id, nombre, email, empresa, plan, trial_expira_en, plan_origen,
                trial_aviso_enviado, rol, activo, created_at
         FROM usuarios ORDER BY created_at DESC'
    );
    $usuarios = $stmt->fetchAll();
    foreach ($usuarios as &$u) {
        if ($u['plan'] === 'pro' && $u['trial_expira_en']) {
            $u['dias_restantes'] = max(0, (int) ceil((strtotime($u['trial_expira_en']) - time()) / 86400));
        } else {
            $u['dias_restantes'] = null;
        }
    }
    respond(true, ['usuarios' => $usuarios]);
}

// PATCH /admin/{id}
if ($method === 'PATCH' && $id) {
    $stmt = $db->prepare('SELECT id FROM usuarios WHERE id = ?');
    $stmt->execute([(int) $id]);
    if (!$stmt->fetch()) respond(false, null, 'Usuario no encontrado', 404);

    $body   = getBody();
    $fields = [];
    $params = [];

    if (isset($body['plan']) && in_array($body['plan'], ['free', 'pro'])) {
        $fields[] = 'plan = ?'; $params[] = $body['plan'];
    }
    if (array_key_exists('trial_expira_en', $body)) {
        $fields[] = 'trial_expira_en = ?'; $params[] = $body['trial_expira_en'] ?: null;
    }
    if (isset($body['plan_origen'])) {
        $fields[] = 'plan_origen = ?'; $params[] = $body['plan_origen'];
    }
    if (isset($body['activo'])) {
        $fields[] = 'activo = ?'; $params[] = $body['activo'] ? 1 : 0;
    }

    if (empty($fields)) respond(false, null, 'Nada que actualizar', 422);

    $params[] = (int) $id;
    $db->prepare('UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $stmt = $db->prepare(
        'SELECT id, nombre, email, plan, trial_expira_en, plan_origen, rol, activo FROM usuarios WHERE id = ?'
    );
    $stmt->execute([(int) $id]);
    respond(true, ['usuario' => $stmt->fetch()]);
}

respond(false, null, 'Método no permitido', 405);
