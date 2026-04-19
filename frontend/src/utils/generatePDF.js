/**
 * Quota — Generación de PDF con jsPDF
 * TODO: Implementar cuando se implemente VerPresupuesto
 * Diseño básico sin logo (V1). Logo en V2.
 */

import { formatCurrency } from './formatCurrency'

/**
 * Genera y descarga un PDF del presupuesto.
 * @param {object} presupuesto — objeto completo con items incluidos
 */
export async function generatePDF(presupuesto) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const { numero, items = [], subtotal, total, descuento_pct, moneda,
          nota_cliente, fecha_emision, fecha_vencimiento,
          cliente_nombre, cliente_email, cliente_whatsapp } = presupuesto

  const margin  = 20
  const pageW   = 210
  let   y       = margin

  // ── Encabezado ────────────────────────────────────────────────────────────
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Quota', margin, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Presupuesto N° ${numero}`, pageW - margin, y, { align: 'right' })
  y += 6
  if (fecha_emision) {
    doc.text(`Fecha: ${formatFecha(fecha_emision)}`, pageW - margin, y, { align: 'right' })
  }
  if (fecha_vencimiento) {
    y += 5
    doc.text(`Vence: ${formatFecha(fecha_vencimiento)}`, pageW - margin, y, { align: 'right' })
  }

  // ── Cliente ───────────────────────────────────────────────────────────────
  y += 12
  doc.setTextColor(0)
  if (cliente_nombre) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Para:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(cliente_nombre, margin + 14, y)
    y += 6
    if (cliente_email)    doc.text(cliente_email,    margin, y), (y += 5)
    if (cliente_whatsapp) doc.text(cliente_whatsapp, margin, y), (y += 5)
  }

  // ── Línea separadora ──────────────────────────────────────────────────────
  y += 4
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── Ítems ─────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text('Descripción', margin, y)
  doc.text('Cant.', 140, y, { align: 'right' })
  doc.text('Precio unit.', 165, y, { align: 'right' })
  doc.text('Subtotal', pageW - margin, y, { align: 'right' })
  y += 6
  doc.setDrawColor(220)
  doc.line(margin, y, pageW - margin, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0)
  doc.setFontSize(10)

  for (const item of items) {
    doc.setFont('helvetica', 'bold')
    doc.text(item.nombre, margin, y)
    doc.setFont('helvetica', 'normal')
    if (item.descripcion) {
      y += 5
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(item.descripcion, margin + 2, y)
      doc.setFontSize(10)
      doc.setTextColor(0)
    }
    doc.text(String(item.cantidad), 140, y, { align: 'right' })
    doc.text(formatCurrency(item.precio, moneda), 165, y, { align: 'right' })
    doc.text(formatCurrency(item.subtotal, moneda), pageW - margin, y, { align: 'right' })
    y += 8
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  y += 4
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 7

  doc.setFontSize(10)
  doc.text('Subtotal:', 145, y)
  doc.text(formatCurrency(subtotal, moneda), pageW - margin, y, { align: 'right' })
  y += 7

  if (descuento_pct > 0) {
    doc.setTextColor(180, 0, 0)
    doc.text(`Descuento (${descuento_pct}%):`, 145, y)
    const descMonto = subtotal * descuento_pct / 100
    doc.text(`- ${formatCurrency(descMonto, moneda)}`, pageW - margin, y, { align: 'right' })
    doc.setTextColor(0)
    y += 7
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', 145, y)
  doc.text(formatCurrency(total, moneda), pageW - margin, y, { align: 'right' })
  y += 10

  // ── Nota al cliente ───────────────────────────────────────────────────────
  if (nota_cliente) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100)
    const lines = doc.splitTextToSize(nota_cliente, pageW - margin * 2)
    doc.text(lines, margin, y)
  }

  doc.save(`Presupuesto-${numero}.pdf`)
}

function formatFecha(fechaISO) {
  if (!fechaISO) return ''
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}
