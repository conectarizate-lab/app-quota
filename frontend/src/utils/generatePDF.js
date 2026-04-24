import { formatCurrency } from './formatCurrency'

function formatFecha(fechaISO) {
  if (!fechaISO) return ''
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}

// RGB de los colores de marca
const NAVY   = [52,  65,  82]
const ORANGE = [186, 104, 60]
const GRAY   = [120, 120, 120]
const LIGHT  = [245, 245, 243]

export async function generatePDF(presupuesto, emisor = {}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const {
    numero, items = [], subtotal, total, descuento_pct, moneda,
    nota_cliente, fecha_emision, fecha_vencimiento,
    cliente_nombre, cliente_email, cliente_whatsapp, cliente_empresa,
  } = presupuesto

  const margin = 18
  const pageW  = 210
  const colR   = pageW - margin
  let   y      = margin

  // ── Encabezado: emisor (izquierda) + título (derecha) ──────────────────────
  const empresa  = emisor.empresa  || emisor.nombre || 'Quota'
  const nombre   = emisor.nombre   || ''
  const email    = emisor.email    || ''
  const whatsapp = emisor.whatsapp || ''

  // Nombre de empresa grande
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...NAVY)
  doc.text(empresa, margin, y + 4)

  // Datos del emisor debajo
  let yEmisor = y + 11
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAY)
  if (nombre && nombre !== empresa) {
    doc.text(nombre, margin, yEmisor)
    yEmisor += 4.5
  }
  if (email) {
    doc.text(email, margin, yEmisor)
    yEmisor += 4.5
  }
  if (whatsapp) {
    doc.text(whatsapp, margin, yEmisor)
    yEmisor += 4.5
  }

  // "PRESUPUESTO" en grande a la derecha
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...NAVY)
  doc.text('PRESUPUESTO', colR, y + 5, { align: 'right' })

  // Número y fecha a la derecha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(`N° ${String(numero).padStart(3, '0')}`, colR, y + 12, { align: 'right' })
  if (fecha_emision) {
    doc.text(`Fecha: ${formatFecha(fecha_emision)}`, colR, y + 17, { align: 'right' })
  }

  // ── Línea navy ─────────────────────────────────────────────────────────────
  y = Math.max(yEmisor, y + 22) + 4
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.8)
  doc.line(margin, y, colR, y)
  y += 7

  // ── Bloque "Para" (cliente) ────────────────────────────────────────────────
  if (cliente_nombre) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...ORANGE)
    doc.text('PARA', margin, y)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...NAVY)
    doc.text(cliente_nombre, margin, y)
    y += 5.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...GRAY)
    if (cliente_empresa) { doc.text(cliente_empresa, margin, y); y += 4.5 }
    if (cliente_email)   { doc.text(cliente_email,   margin, y); y += 4.5 }
    if (cliente_whatsapp){ doc.text(cliente_whatsapp, margin, y); y += 4.5 }
    y += 2
  }

  // Validez del presupuesto
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAY)
  if (fecha_vencimiento) {
    doc.text(`Válido hasta: ${formatFecha(fecha_vencimiento)}`, colR, y - (cliente_nombre ? 14 : 2), { align: 'right' })
  } else if (fecha_emision) {
    const vence = new Date(fecha_emision)
    vence.setDate(vence.getDate() + 15)
    const venceStr = vence.toISOString().slice(0, 10)
    doc.text(`Válido hasta: ${formatFecha(venceStr)} (15 días)`, colR, y - (cliente_nombre ? 14 : 2), { align: 'right' })
  }

  // ── Línea separadora ───────────────────────────────────────────────────────
  doc.setDrawColor(210, 208, 204)
  doc.setLineWidth(0.3)
  doc.line(margin, y, colR, y)
  y += 6

  // ── Cabecera de tabla ──────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT)
  doc.rect(margin, y - 3, colR - margin, 7, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...NAVY)
  doc.text('Descripción',   margin + 2, y + 1)
  doc.text('Cant.',         148,        y + 1, { align: 'right' })
  doc.text('Precio unit.',  170,        y + 1, { align: 'right' })
  doc.text('Subtotal',      colR,       y + 1, { align: 'right' })
  y += 8

  // ── Ítems ──────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  for (const item of items) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text(item.nombre, margin + 2, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text(String(item.cantidad),                  148, y, { align: 'right' })
    doc.text(formatCurrency(item.precio,   moneda),  170, y, { align: 'right' })
    doc.setTextColor(...NAVY)
    doc.text(formatCurrency(item.subtotal, moneda),  colR, y, { align: 'right' })
    y += 5

    if (item.descripcion) {
      doc.setFontSize(7.5)
      doc.setTextColor(...GRAY)
      const lines = doc.splitTextToSize(item.descripcion, 100)
      doc.text(lines, margin + 4, y)
      y += lines.length * 3.8
      doc.setFontSize(9)
    }
    y += 2
  }

  // ── Totales ────────────────────────────────────────────────────────────────
  y += 2
  doc.setDrawColor(210, 208, 204)
  doc.setLineWidth(0.3)
  doc.line(margin, y, colR, y)
  y += 6

  const totalesX = 135
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text('Subtotal:',  totalesX, y)
  doc.setTextColor(...NAVY)
  doc.text(formatCurrency(subtotal, moneda), colR, y, { align: 'right' })
  y += 6

  if (descuento_pct > 0) {
    const descMonto = subtotal * descuento_pct / 100
    doc.setTextColor(...GRAY)
    doc.text(`Descuento (${descuento_pct}%):`, totalesX, y)
    doc.setTextColor(...ORANGE)
    doc.text(`- ${formatCurrency(descMonto, moneda)}`, colR, y, { align: 'right' })
    doc.setTextColor(0)
    y += 6
  }

  // Fila TOTAL con fondo
  doc.setFillColor(...NAVY)
  doc.rect(totalesX - 4, y - 4, colR - totalesX + 4, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', totalesX, y + 1)
  doc.text(formatCurrency(total, moneda), colR, y + 1, { align: 'right' })
  y += 12

  // ── Nota al cliente ────────────────────────────────────────────────────────
  if (nota_cliente) {
    doc.setFillColor(...LIGHT)
    const notaLines = doc.splitTextToSize(nota_cliente, colR - margin - 4)
    const notaH = notaLines.length * 4.5 + 8
    doc.rect(margin, y, colR - margin, notaH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...ORANGE)
    doc.text('NOTA', margin + 3, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...NAVY)
    doc.setFontSize(8.5)
    doc.text(notaLines, margin + 3, y + 10)
    y += notaH + 6
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = 280
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY, colR, footerY)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)

  const validezTexto = fecha_vencimiento
    ? `Este presupuesto tiene validez hasta el ${formatFecha(fecha_vencimiento)}.`
    : 'Este presupuesto tiene validez de 15 días a partir de la fecha de emisión.'

  doc.text(validezTexto, margin, footerY + 5)
  doc.setFont('helvetica', 'normal')
  doc.text('Generado con Quota · quota.conectarizate.com', colR, footerY + 5, { align: 'right' })

  doc.save(`Presupuesto-${numero}.pdf`)
}
