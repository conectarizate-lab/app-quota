/**
 * Quota — Generadores de texto para compartir presupuestos
 */

import { formatCurrency } from './formatCurrency'

/**
 * Texto plano para email.
 */
export function generarTextoEmail(presupuesto) {
  const { numero, items = [], subtotal, total, descuento_pct, moneda, nota_cliente,
          fecha_vencimiento, cliente_nombre } = presupuesto

  const lineas = [
    `PRESUPUESTO N° ${numero}`,
    cliente_nombre ? `Cliente: ${cliente_nombre}` : '',
    '',
    'SERVICIOS:',
    ...items.map(
      (it) => `- ${it.nombre}${it.descripcion ? ` (${it.descripcion})` : ''}` +
              `  x${it.cantidad}  ${formatCurrency(it.subtotal, moneda)}`
    ),
    '',
    `Subtotal: ${formatCurrency(subtotal, moneda)}`,
    descuento_pct > 0 ? `Descuento: ${descuento_pct}%` : '',
    `TOTAL: ${formatCurrency(total, moneda)}`,
    '',
    fecha_vencimiento ? `Válido hasta: ${formatFecha(fecha_vencimiento)}` : '',
    nota_cliente ? `\nNota: ${nota_cliente}` : '',
  ]

  return lineas.filter((l) => l !== '').join('\n')
}

/**
 * Texto optimizado para WhatsApp (emojis + formato).
 */
export function generarTextoWhatsApp(presupuesto) {
  const { numero, items = [], subtotal, total, descuento_pct, moneda, nota_cliente,
          fecha_vencimiento, cliente_nombre } = presupuesto

  const lineas = [
    `*PRESUPUESTO N° ${numero}*`,
    cliente_nombre ? `👤 ${cliente_nombre}` : '',
    '',
    '*Servicios:*',
    ...items.map(
      (it) => `▸ ${it.nombre}${it.descripcion ? `\n  _${it.descripcion}_` : ''}` +
              `\n  x${it.cantidad} — ${formatCurrency(it.subtotal, moneda)}`
    ),
    '',
    `Subtotal: ${formatCurrency(subtotal, moneda)}`,
    descuento_pct > 0 ? `Descuento: ${descuento_pct}%` : '',
    `*Total: ${formatCurrency(total, moneda)}*`,
    '',
    fecha_vencimiento ? `📅 Válido hasta: ${formatFecha(fecha_vencimiento)}` : '',
    nota_cliente ? `\n📝 ${nota_cliente}` : '',
  ]

  return lineas.filter((l) => l !== '').join('\n')
}

function formatFecha(fechaISO) {
  if (!fechaISO) return ''
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}
