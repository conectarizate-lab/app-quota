<?php
/**
 * Quota — Servicios routes
 * GET    /servicios        — listar activos del usuario
 * POST   /servicios        — crear
 * PUT    /servicios/{id}   — editar
 * DELETE /servicios/{id}   — soft delete (activo = 0)
 */

$auth   = require_auth();
$userId = (int) $auth['sub'];
$db     = getDB();

// GET /servicios
if ($method === 'GET' && !$id) {
    $stmt = $db->prepare(
        'SELECT id, nombre, descripcion, precio, moneda, categoria, created_at
         FROM servicios
         WHERE usuario_id = ? AND activo = 1
         ORDER BY categoria, nombre'
    );
    $stmt->execute([$userId]);
    respond(true, ['servicios' => $stmt->fetchAll()]);
}

// POST /servicios
if ($method === 'POST' && !$id) {
    $body   = getBody();
    $nombre = trim($body['nombre'] ?? '');
    if (!$nombre) respond(false, null, 'El nombre del servicio es requerido', 422);

    $precio    = max(0, (float) ($body['precio'] ?? 0));
    $moneda    = in_array($body['moneda'] ?? '', ['ARS', 'USD', 'UYU']) ? $body['moneda'] : 'ARS';
    $categoria = trim($body['categoria'] ?? '');
    $desc      = trim($body['descripcion'] ?? '');

    $db->prepare(
        'INSERT INTO servicios (usuario_id, nombre, descripcion, precio, moneda, categoria)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$userId, $nombre, $desc, $precio, $moneda, $categoria]);

    $newId = (int) $db->lastInsertId();
    $stmt  = $db->prepare('SELECT * FROM servicios WHERE id = ?');
    $stmt->execute([$newId]);
    respond(true, ['servicio' => $stmt->fetch()], '', 201);
}

// PUT /servicios/{id}
if ($method === 'PUT' && $id) {
    $servId = (int) $id;
    $stmt   = $db->prepare('SELECT id FROM servicios WHERE id = ? AND usuario_id = ? AND activo = 1');
    $stmt->execute([$servId, $userId]);
    if (!$stmt->fetch()) respond(false, null, 'Servicio no encontrado', 404);

    $body   = getBody();
    $fields = [];
    $params = [];

    if (!empty(trim($body['nombre'] ?? ''))) {
        $fields[] = 'nombre = ?'; $params[] = trim($body['nombre']);
    }
    if (isset($body['descripcion'])) {
        $fields[] = 'descripcion = ?'; $params[] = trim($body['descripcion']);
    }
    if (isset($body['precio'])) {
        $fields[] = 'precio = ?'; $params[] = max(0, (float) $body['precio']);
    }
    if (isset($body['moneda']) && in_array($body['moneda'], ['ARS', 'USD', 'UYU'])) {
        $fields[] = 'moneda = ?'; $params[] = $body['moneda'];
    }
    if (isset($body['categoria'])) {
        $fields[] = 'categoria = ?'; $params[] = trim($body['categoria']);
    }

    if (!empty($fields)) {
        $params[] = $servId;
        $db->prepare('UPDATE servicios SET ' . implode(', ', $fields) . ' WHERE id = ?')
           ->execute($params);
    }

    $stmt = $db->prepare('SELECT * FROM servicios WHERE id = ?');
    $stmt->execute([$servId]);
    respond(true, ['servicio' => $stmt->fetch()]);
}

// DELETE /servicios/{id} — soft delete
if ($method === 'DELETE' && $id) {
    $servId = (int) $id;
    $stmt   = $db->prepare('SELECT id FROM servicios WHERE id = ? AND usuario_id = ? AND activo = 1');
    $stmt->execute([$servId, $userId]);
    if (!$stmt->fetch()) respond(false, null, 'Servicio no encontrado', 404);

    $db->prepare('UPDATE servicios SET activo = 0 WHERE id = ?')->execute([$servId]);
    respond(true, ['message' => 'Servicio eliminado']);
}

respond(false, null, 'Método no permitido', 405);
