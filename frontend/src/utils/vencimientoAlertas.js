export function diasParaVencer(fechaVencimiento) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaVencimiento + 'T00:00:00')
  return Math.floor((fecha - hoy) / (1000 * 60 * 60 * 24))
}

export function nivelAlerta(fechaVencimiento, estado) {
  if (!['pendiente', 'recordatorio_enviado'].includes(estado)) return null
  const dias = diasParaVencer(fechaVencimiento)
  if (dias < 0)  return 'rojo'
  if (dias <= 3) return 'naranja'
  if (dias <= 7) return 'amarillo'
  return 'gris'
}

export function formatFechaLegible(fechaISO) {
  if (!fechaISO) return ''
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}

export function generarMensajeRecordatorio(vencimiento) {
  const { concepto, monto, moneda, cliente_nombre, fecha_vencimiento } = vencimiento
  const dias   = diasParaVencer(fecha_vencimiento)
  const fecha  = formatFechaLegible(fecha_vencimiento)
  const montoStr = monto
    ? `$${parseFloat(monto).toLocaleString('es-AR')} ${moneda}`
    : concepto

  if (!cliente_nombre) {
    return `Recordatorio: vence el ${fecha} — ${concepto}${monto ? ` — ${montoStr}` : ''}`
  }
  if (dias > 0) {
    return `Hola ${cliente_nombre}! Te escribo para recordarte que el ${fecha} vence el pago de ${concepto} por ${montoStr}. Cualquier consulta me avisás. ¡Gracias!`
  }
  if (dias === 0) {
    return `Hola ${cliente_nombre}! Te recuerdo que hoy vence el pago de ${concepto} por ${montoStr}. Cuando puedas realizarlo te aviso confirmación. ¡Gracias!`
  }
  return `Hola ${cliente_nombre}! Te escribo porque quedó pendiente el pago de ${concepto} por ${montoStr} que venció el ${fecha}. Cuando puedas regularizarlo me avisás. ¡Gracias!`
}
