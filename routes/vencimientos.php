<?php
/**
 * Quota — Vencimientos routes
 * GET    /vencimientos
 * POST   /vencimientos
 * GET    /vencimientos/alertas
 * GET    /vencimientos/{id}
 * PUT    /vencimientos/{id}
 * PATCH  /vencimientos/{id}/estado
 * DELETE /vencimientos/{id}
 */

$auth = require_auth();
$uid  = $auth['sub'];
$db   = getDB();

// GET /vencimientos/alertas — debe ir antes que GET /{id}
if ($method === 'GET' && $id === 'alertas') {
    $hoy = date('Y-m-d');
    $en3 = date('Y-m-d', strtotime('+3 days'));
    $en7 = date('Y-m-d', strtotime('+7 days'));

    $stmt = $db->prepare(
        "SELECT v.*, c.nombre AS cliente_nombre
         FROM vencimientos v
         LEFT JOIN clientes c ON c.id = v.cliente_id
         WHERE v.usuario_id = ?
           AND v.estado IN ('pendiente', 'recordatorio_enviado')
         ORDER BY v.fecha_vencimiento ASC"
    );
    $stmt->execute([$uid]);
    $todos = $stmt->fetchAll();

    $vencidos  = [];
    $proximos3 = [];
    $proximos7 = [];
    $totalCobro = 0;
    $totalPago  = 0;

    foreach ($todos as $v) {
        $fecha = $v['fecha_vencimiento'];
        if ($fecha < $hoy) {
            $vencidos[] = $v;
        } elseif ($fecha <= $en3) {
            $proximos3[] = $v;
        } elseif ($fecha <= $en7) {
            $proximos7[] = $v;
        }
        if ($v['tipo'] === 'cobro') $totalCobro += (float)($v['monto'] ?? 0);
        if ($v['tipo'] === 'pago')  $totalPago  += (float)($v['monto'] ?? 0);
    }

    respond(true, [
        'vencidos'              => $vencidos,
        'proximos_3_dias'       => $proximos3,
        'proximos_7_dias'       => $proximos7,
        'total_pendiente_cobro' => $totalCobro,
        'total_pendiente_pago'  => $totalPago,
    ]);
}

// GET /vencimientos
if ($method === 'GET' && $id === null) {
    $where  = ['v.usuario_id = ?'];
    $params = [$uid];

    if (!empty($_GET['tipo']) && in_array($_GET['tipo'], ['cobro', 'pago'])) {
        $where[]  = 'v.tipo = ?';
        $params[] = $_GET['tipo'];
    }
    if (!empty($_GET['estado'])) {
        $where[]  = 'v.estado = ?';
        $params[] = $_GET['estado'];
    }
    if (!empty($_GET['cliente_id'])) {
        $where[]  = 'v.cliente_id = ?';
        $params[] = (int) $_GET['cliente_id'];
    }
    if (!empty($_GET['desde'])) {
        $where[]  = 'v.fecha_vencimiento >= ?';
        $params[] = $_GET['desde'];
    }
    if (!empty($_GET['hasta'])) {
        $where[]  = 'v.fecha_vencimiento <= ?';
        $params[] = $_GET['hasta'];
    }

    $stmt = $db->prepare(
        'SELECT v.*, c.nombre AS cliente_nombre
         FROM vencimientos v
         LEFT JOIN clientes c ON c.id = v.cliente_id
         WHERE ' . implode(' AND ', $where) . '
         ORDER BY v.fecha_vencimiento ASC'
    );
    $stmt->execute($params);
    respond(true, ['vencimientos' => $stmt->fetchAll()]);
}

// POST /vencimientos
if ($method === 'POST' && $id === null) {
    $body       = getBody();
    $tipo       = in_array($body['tipo'] ?? '', ['cobro', 'pago']) ? $body['tipo'] : null;
    $concepto   = trim($body['concepto'] ?? '');
    $monto      = isset($body['monto']) && $body['monto'] !== '' ? (float) $body['monto'] : null;
    $moneda     = in_array($body['moneda'] ?? '', ['ARS', 'USD', 'UYU']) ? $body['moneda'] : 'ARS';
    $clienteId  = ($tipo === 'cobro' && !empty($body['cliente_id'])) ? (int) $body['cliente_id'] : null;
    $fecha      = trim($body['fecha_vencimiento'] ?? '');
    $recurrencia = in_array($body['recurrencia'] ?? '', ['unico', 'semanal', 'mensual', 'anual'])
                   ? $body['recurrencia'] : 'unico';
    $notas = trim($body['notas'] ?? '');

    if (!$tipo || !$concepto || !$fecha) {
        respond(false, null, 'Tipo, concepto y fecha son requeridos', 422);
    }

    $db->prepare(
        'INSERT INTO vencimientos (usuario_id, tipo, concepto, monto, moneda, cliente_id, fecha_vencimiento, recurrencia, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([$uid, $tipo, $concepto, $monto, $moneda, $clienteId, $fecha, $recurrencia, $notas]);

    $newId = (int) $db->lastInsertId();
    $stmt  = $db->prepare(
        'SELECT v.*, c.nombre AS cliente_nombre FROM vencimientos v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?'
    );
    $stmt->execute([$newId]);
    respond(true, ['vencimiento' => $stmt->fetch()], '', 201);
}

// GET /vencimientos/{id}
if ($method === 'GET' && $id !== null) {
    $stmt = $db->prepare(
        'SELECT v.*, c.nombre AS cliente_nombre FROM vencimientos v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ? AND v.usuario_id = ?'
    );
    $stmt->execute([(int) $id, $uid]);
    $v = $stmt->fetch();
    if (!$v) respond(false, null, 'No encontrado', 404);

    $stmtH = $db->prepare(
        'SELECT * FROM vencimientos_historial WHERE vencimiento_id = ? ORDER BY fecha_pago DESC'
    );
    $stmtH->execute([(int) $id]);
    $v['historial'] = $stmtH->fetchAll();
    respond(true, ['vencimiento' => $v]);
}

// PUT /vencimientos/{id}
if ($method === 'PUT' && $id !== null && $action === null) {
    $stmt = $db->prepare('SELECT id FROM vencimientos WHERE id = ? AND usuario_id = ?');
    $stmt->execute([(int) $id, $uid]);
    if (!$stmt->fetch()) respond(false, null, 'No encontrado', 404);

    $body       = getBody();
    $tipo       = in_array($body['tipo'] ?? '', ['cobro', 'pago']) ? $body['tipo'] : null;
    $concepto   = trim($body['concepto'] ?? '');
    $monto      = isset($body['monto']) && $body['monto'] !== '' ? (float) $body['monto'] : null;
    $moneda     = in_array($body['moneda'] ?? '', ['ARS', 'USD', 'UYU']) ? $body['moneda'] : 'ARS';
    $clienteId  = ($tipo === 'cobro' && !empty($body['cliente_id'])) ? (int) $body['cliente_id'] : null;
    $fecha      = trim($body['fecha_vencimiento'] ?? '');
    $recurrencia = in_array($body['recurrencia'] ?? '', ['unico', 'semanal', 'mensual', 'anual'])
                   ? $body['recurrencia'] : 'unico';
    $notas = trim($body['notas'] ?? '');

    if (!$tipo || !$concepto || !$fecha) {
        respond(false, null, 'Tipo, concepto y fecha son requeridos', 422);
    }

    $db->prepare(
        'UPDATE vencimientos SET tipo=?, concepto=?, monto=?, moneda=?, cliente_id=?, fecha_vencimiento=?, recurrencia=?, notas=? WHERE id=?'
    )->execute([$tipo, $concepto, $monto, $moneda, $clienteId, $fecha, $recurrencia, $notas, (int) $id]);

    $stmt = $db->prepare(
        'SELECT v.*, c.nombre AS cliente_nombre FROM vencimientos v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?'
    );
    $stmt->execute([(int) $id]);
    respond(true, ['vencimiento' => $stmt->fetch()]);
}

// PATCH /vencimientos/{id}/estado
if ($method === 'PATCH' && $id !== null && $action === 'estado') {
    $stmt = $db->prepare('SELECT * FROM vencimientos WHERE id = ? AND usuario_id = ?');
    $stmt->execute([(int) $id, $uid]);
    $v = $stmt->fetch();
    if (!$v) respond(false, null, 'No encontrado', 404);

    $body      = getBody();
    $estado    = $body['estado'] ?? '';
    $fechaPago = $body['fecha_pago'] ?? date('Y-m-d');
    $montoPago = isset($body['monto_pagado']) && $body['monto_pagado'] !== '' ? (float) $body['monto_pagado'] : null;
    $notas     = trim($body['notas'] ?? '');

    $estadosValidos = ['pendiente', 'recordatorio_enviado', 'cobrado', 'pagado', 'vencido'];
    if (!in_array($estado, $estadosValidos)) {
        respond(false, null, 'Estado inválido', 422);
    }

    $db->prepare('UPDATE vencimientos SET estado = ? WHERE id = ?')->execute([$estado, (int) $id]);

    if (in_array($estado, ['cobrado', 'pagado']) && $v['recurrencia'] !== 'unico') {
        $db->prepare(
            'INSERT INTO vencimientos_historial (vencimiento_id, fecha_pago, monto_pagado, notas) VALUES (?, ?, ?, ?)'
        )->execute([(int) $id, $fechaPago, $montoPago, $notas]);

        $fechaBase = $v['fecha_vencimiento'];
        switch ($v['recurrencia']) {
            case 'semanal':  $proxima = date('Y-m-d', strtotime($fechaBase . ' +7 days'));  break;
            case 'mensual':  $proxima = date('Y-m-d', strtotime($fechaBase . ' +1 month')); break;
            case 'anual':    $proxima = date('Y-m-d', strtotime($fechaBase . ' +1 year'));  break;
            default:         $proxima = $fechaBase;
        }

        $db->prepare(
            'INSERT INTO vencimientos (usuario_id, tipo, concepto, monto, moneda, cliente_id, fecha_vencimiento, recurrencia, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $uid, $v['tipo'], $v['concepto'], $v['monto'], $v['moneda'],
            $v['cliente_id'], $proxima, $v['recurrencia'], $v['notas'],
        ]);
    }

    $stmt = $db->prepare(
        'SELECT v.*, c.nombre AS cliente_nombre FROM vencimientos v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?'
    );
    $stmt->execute([(int) $id]);
    respond(true, ['vencimiento' => $stmt->fetch()]);
}

// DELETE /vencimientos/{id}
if ($method === 'DELETE' && $id !== null) {
    $stmt = $db->prepare('SELECT id FROM vencimientos WHERE id = ? AND usuario_id = ?');
    $stmt->execute([(int) $id, $uid]);
    if (!$stmt->fetch()) respond(false, null, 'No encontrado', 404);

    $db->prepare('DELETE FROM vencimientos WHERE id = ?')->execute([(int) $id]);
    respond(true, null);
}

respond(false, null, 'Método no permitido', 405);
