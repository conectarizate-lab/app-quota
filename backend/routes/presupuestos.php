<?php
/**
 * Quota — Presupuestos routes
 * GET    /presupuestos                  — listar (filtros: estado, cliente_id, desde, hasta)
 * POST   /presupuestos                  — crear con ítems
 * GET    /presupuestos/{id}             — ver completo con ítems y cliente
 * PUT    /presupuestos/{id}             — editar y reemplazar ítems
 * PATCH  /presupuestos/{id}/estado      — cambiar solo el estado
 * DELETE /presupuestos/{id}             — eliminar
 */

$auth   = require_auth();
$userId = (int) $auth['sub'];
$db     = getDB();

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularTotales(array $items, float $descuentoPct): array
{
    $subtotal = array_reduce($items, fn($carry, $item) =>
        $carry + (float) ($item['precio'] ?? 0) * (int) ($item['cantidad'] ?? 1), 0.0
    );
    $total = $subtotal - ($subtotal * $descuentoPct / 100);
    return ['subtotal' => round($subtotal, 2), 'total' => round($total, 2)];
}

function siguienteNumero(PDO $db, int $userId): string
{
    $stmt = $db->prepare(
        'SELECT COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) AS ultimo
         FROM presupuestos WHERE usuario_id = ?'
    );
    $stmt->execute([$userId]);
    return str_pad((int) $stmt->fetch()['ultimo'] + 1, 3, '0', STR_PAD_LEFT);
}

function insertarItems(PDO $db, int $presupuestoId, array $items): void
{
    $stmt = $db->prepare(
        'INSERT INTO presupuesto_items
         (presupuesto_id, servicio_id, nombre, descripcion, precio, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($items as $item) {
        $precio   = max(0, (float) ($item['precio']   ?? 0));
        $cantidad = max(1, (int)   ($item['cantidad'] ?? 1));
        $stmt->execute([
            $presupuestoId,
            $item['servicio_id'] ?? null,
            trim($item['nombre']      ?? ''),
            trim($item['descripcion'] ?? ''),
            $precio,
            $cantidad,
            round($precio * $cantidad, 2),
        ]);
    }
}

// ── GET /presupuestos ─────────────────────────────────────────────────────────
if ($method === 'GET' && !$id) {
    $where  = ['p.usuario_id = ?'];
    $params = [$userId];

    $estadosValidos = ['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido'];
    if (!empty($_GET['estado']) && in_array($_GET['estado'], $estadosValidos)) {
        $where[] = 'p.estado = ?'; $params[] = $_GET['estado'];
    }
    if (!empty($_GET['cliente_id'])) {
        $where[] = 'p.cliente_id = ?'; $params[] = (int) $_GET['cliente_id'];
    }
    if (!empty($_GET['desde'])) {
        $where[] = 'DATE(p.created_at) >= ?'; $params[] = $_GET['desde'];
    }
    if (!empty($_GET['hasta'])) {
        $where[] = 'DATE(p.created_at) <= ?'; $params[] = $_GET['hasta'];
    }

    $stmt = $db->prepare(
        'SELECT p.id, p.numero, p.estado, p.subtotal, p.total, p.moneda,
                p.descuento_pct, p.fecha_emision, p.fecha_vencimiento, p.created_at,
                c.nombre AS cliente_nombre
         FROM presupuestos p
         LEFT JOIN clientes c ON p.cliente_id = c.id
         WHERE ' . implode(' AND ', $where) . '
         ORDER BY p.created_at DESC'
    );
    $stmt->execute($params);
    respond(true, ['presupuestos' => $stmt->fetchAll()]);
}

// ── POST /presupuestos ────────────────────────────────────────────────────────
if ($method === 'POST' && !$id) {
    $body  = getBody();
    $items = $body['items'] ?? [];
    if (empty($items)) respond(false, null, 'El presupuesto debe tener al menos un ítem', 422);

    $descuentoPct = min(100, max(0, (float) ($body['descuento_pct'] ?? 0)));
    $moneda       = in_array($body['moneda'] ?? '', ['ARS', 'USD', 'UYU']) ? $body['moneda'] : 'ARS';
    $clienteId    = !empty($body['cliente_id']) ? (int) $body['cliente_id'] : null;
    $totales      = calcularTotales($items, $descuentoPct);
    $numero       = siguienteNumero($db, $userId);

    if ($clienteId) {
        $s = $db->prepare('SELECT id FROM clientes WHERE id = ? AND usuario_id = ?');
        $s->execute([$clienteId, $userId]);
        if (!$s->fetch()) respond(false, null, 'Cliente no encontrado', 404);
    }

    $db->beginTransaction();
    try {
        $db->prepare(
            "INSERT INTO presupuestos
             (usuario_id, cliente_id, numero, estado, descuento_pct, subtotal, total,
              moneda, nota_cliente, fecha_emision, fecha_vencimiento)
             VALUES (?, ?, ?, 'borrador', ?, ?, ?, ?, ?, ?, ?)"
        )->execute([
            $userId, $clienteId, $numero, $descuentoPct,
            $totales['subtotal'], $totales['total'], $moneda,
            trim($body['nota_cliente']     ?? ''),
            date('Y-m-d'),
            $body['fecha_vencimiento']     ?? null,
        ]);
        $presupuestoId = (int) $db->lastInsertId();
        insertarItems($db, $presupuestoId, $items);
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        respond(false, null, 'Error al crear el presupuesto', 500);
    }

    $stmt = $db->prepare('SELECT * FROM presupuestos WHERE id = ?');
    $stmt->execute([$presupuestoId]);
    respond(true, ['presupuesto' => $stmt->fetch()], '', 201);
}

// ── GET /presupuestos/{id} ────────────────────────────────────────────────────
if ($method === 'GET' && $id && !$action) {
    $presId = (int) $id;
    $stmt   = $db->prepare(
        'SELECT p.*,
                c.nombre   AS cliente_nombre,
                c.email    AS cliente_email,
                c.whatsapp AS cliente_whatsapp,
                c.empresa  AS cliente_empresa
         FROM presupuestos p
         LEFT JOIN clientes c ON p.cliente_id = c.id
         WHERE p.id = ? AND p.usuario_id = ?'
    );
    $stmt->execute([$presId, $userId]);
    $presupuesto = $stmt->fetch();
    if (!$presupuesto) respond(false, null, 'Presupuesto no encontrado', 404);

    $stmt = $db->prepare(
        'SELECT * FROM presupuesto_items WHERE presupuesto_id = ? ORDER BY id'
    );
    $stmt->execute([$presId]);
    $presupuesto['items'] = $stmt->fetchAll();
    respond(true, ['presupuesto' => $presupuesto]);
}

// ── PUT /presupuestos/{id} ────────────────────────────────────────────────────
if ($method === 'PUT' && $id && !$action) {
    $presId = (int) $id;
    $stmt   = $db->prepare('SELECT id FROM presupuestos WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$presId, $userId]);
    if (!$stmt->fetch()) respond(false, null, 'Presupuesto no encontrado', 404);

    $body  = getBody();
    $items = $body['items'] ?? [];
    if (empty($items)) respond(false, null, 'El presupuesto debe tener al menos un ítem', 422);

    $descuentoPct = min(100, max(0, (float) ($body['descuento_pct'] ?? 0)));
    $moneda       = in_array($body['moneda'] ?? '', ['ARS', 'USD', 'UYU']) ? $body['moneda'] : 'ARS';
    $clienteId    = !empty($body['cliente_id']) ? (int) $body['cliente_id'] : null;
    $totales      = calcularTotales($items, $descuentoPct);

    if ($clienteId) {
        $s = $db->prepare('SELECT id FROM clientes WHERE id = ? AND usuario_id = ?');
        $s->execute([$clienteId, $userId]);
        if (!$s->fetch()) respond(false, null, 'Cliente no encontrado', 404);
    }

    $db->beginTransaction();
    try {
        $db->prepare(
            'UPDATE presupuestos SET
             cliente_id = ?, descuento_pct = ?, subtotal = ?, total = ?,
             moneda = ?, nota_cliente = ?, fecha_vencimiento = ?
             WHERE id = ?'
        )->execute([
            $clienteId, $descuentoPct, $totales['subtotal'], $totales['total'],
            $moneda, trim($body['nota_cliente'] ?? ''),
            $body['fecha_vencimiento'] ?? null, $presId,
        ]);
        $db->prepare('DELETE FROM presupuesto_items WHERE presupuesto_id = ?')->execute([$presId]);
        insertarItems($db, $presId, $items);
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        respond(false, null, 'Error al actualizar el presupuesto', 500);
    }

    $stmt = $db->prepare('SELECT * FROM presupuestos WHERE id = ?');
    $stmt->execute([$presId]);
    respond(true, ['presupuesto' => $stmt->fetch()]);
}

// ── PATCH /presupuestos/{id}/estado ──────────────────────────────────────────
if ($method === 'PATCH' && $id && $action === 'estado') {
    $presId = (int) $id;
    $stmt   = $db->prepare('SELECT id FROM presupuestos WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$presId, $userId]);
    if (!$stmt->fetch()) respond(false, null, 'Presupuesto no encontrado', 404);

    $body   = getBody();
    $estado = $body['estado'] ?? '';
    if (!in_array($estado, ['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido'])) {
        respond(false, null, 'Estado inválido', 422);
    }
    $db->prepare('UPDATE presupuestos SET estado = ? WHERE id = ?')->execute([$estado, $presId]);
    respond(true, ['estado' => $estado]);
}

// ── DELETE /presupuestos/{id} ─────────────────────────────────────────────────
if ($method === 'DELETE' && $id && !$action) {
    $presId = (int) $id;
    $stmt   = $db->prepare('SELECT id FROM presupuestos WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$presId, $userId]);
    if (!$stmt->fetch()) respond(false, null, 'Presupuesto no encontrado', 404);

    $db->prepare('DELETE FROM presupuestos WHERE id = ?')->execute([$presId]);
    respond(true, ['message' => 'Presupuesto eliminado']);
}

respond(false, null, 'Método no permitido', 405);
