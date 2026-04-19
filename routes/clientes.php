<?php
/**
 * Quota — Clientes routes
 * GET    /clientes        — listar del usuario
 * POST   /clientes        — crear
 * GET    /clientes/{id}   — ver con sus presupuestos
 * PUT    /clientes/{id}   — editar
 * DELETE /clientes/{id}   — eliminar
 */

$auth   = require_auth();
$userId = (int) $auth['sub'];
$db     = getDB();

// GET /clientes
if ($method === 'GET' && !$id) {
    $stmt = $db->prepare(
        'SELECT id, nombre, email, whatsapp, empresa, notas, created_at
         FROM clientes WHERE usuario_id = ? ORDER BY nombre'
    );
    $stmt->execute([$userId]);
    respond(true, ['clientes' => $stmt->fetchAll()]);
}

// POST /clientes
if ($method === 'POST' && !$id) {
    $body   = getBody();
    $nombre = trim($body['nombre'] ?? '');
    if (!$nombre) respond(false, null, 'El nombre del cliente es requerido', 422);

    $db->prepare(
        'INSERT INTO clientes (usuario_id, nombre, email, whatsapp, empresa, notas)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([
        $userId,
        $nombre,
        trim($body['email']    ?? ''),
        trim($body['whatsapp'] ?? ''),
        trim($body['empresa']  ?? ''),
        trim($body['notas']    ?? ''),
    ]);
    $newId = (int) $db->lastInsertId();
    $stmt  = $db->prepare('SELECT * FROM clientes WHERE id = ?');
    $stmt->execute([$newId]);
    respond(true, ['cliente' => $stmt->fetch()], '', 201);
}

// GET /clientes/{id}
if ($method === 'GET' && $id) {
    $clienteId = (int) $id;
    $stmt = $db->prepare('SELECT * FROM clientes WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$clienteId, $userId]);
    $cliente = $stmt->fetch();
    if (!$cliente) respond(false, null, 'Cliente no encontrado', 404);

    $stmt = $db->prepare(
        'SELECT id, numero, estado, total, moneda, fecha_emision, fecha_vencimiento, created_at
         FROM presupuestos WHERE cliente_id = ? AND usuario_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$clienteId, $userId]);
    $cliente['presupuestos'] = $stmt->fetchAll();
    respond(true, ['cliente' => $cliente]);
}

// PUT /clientes/{id}
if ($method === 'PUT' && $id) {
    $clienteId = (int) $id;
    $stmt = $db->prepare('SELECT id FROM clientes WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$clienteId, $userId]);
    if (!$stmt->fetch()) respond(false, null, 'Cliente no encontrado', 404);

    $body   = getBody();
    $fields = [];
    $params = [];
    foreach (['nombre', 'email', 'whatsapp', 'empresa', 'notas'] as $field) {
        if (isset($body[$field])) {
            $fields[] = "$field = ?";
            $params[] = trim($body[$field]);
        }
    }
    if (!empty($fields)) {
        $params[] = $clienteId;
        $db->prepare('UPDATE clientes SET ' . implode(', ', $fields) . ' WHERE id = ?')
           ->execute($params);
    }
    $stmt = $db->prepare('SELECT * FROM clientes WHERE id = ?');
    $stmt->execute([$clienteId]);
    respond(true, ['cliente' => $stmt->fetch()]);
}

// DELETE /clientes/{id}
if ($method === 'DELETE' && $id) {
    $clienteId = (int) $id;
    $stmt = $db->prepare('SELECT id FROM clientes WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$clienteId, $userId]);
    if (!$stmt->fetch()) respond(false, null, 'Cliente no encontrado', 404);

    $db->prepare('DELETE FROM clientes WHERE id = ?')->execute([$clienteId]);
    respond(true, ['message' => 'Cliente eliminado']);
}

respond(false, null, 'Método no permitido', 405);
