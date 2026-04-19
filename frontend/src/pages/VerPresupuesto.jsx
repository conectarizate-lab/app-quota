import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPresupuesto, updateEstado, deletePresupuesto } from '../api/presupuestos'
import { formatCurrency } from '../utils/formatCurrency'
import { generarTextoWhatsApp, generarTextoEmail } from '../utils/presupuestoTexto'
import { generatePDF } from '../utils/generatePDF'
import styles from './VerPresupuesto.module.css'

const ESTADOS = [
  { value: 'borrador',  label: 'Borrador' },
  { value: 'enviado',   label: 'Enviado' },
  { value: 'aceptado',  label: 'Aceptado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'vencido',   label: 'Vencido' },
]

function formatFecha(fechaISO) {
  if (!fechaISO) return '—'
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}

function EstadoBadge({ estado }) {
  return <span className={`${styles.badge} ${styles[`badge_${estado}`]}`}>{estado}</span>
}

export default function VerPresupuesto() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [presupuesto, setPresupuesto] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [copiado, setCopiado]                 = useState('')
  const [generandoPDF, setGenerandoPDF]       = useState(false)

  useEffect(() => {
    getPresupuesto(id)
      .then(({ data }) => setPresupuesto(data.data.presupuesto))
      .catch(() => setError('No se pudo cargar el presupuesto'))
      .finally(() => setLoading(false))
  }, [id])

  const handleEstado = async (nuevoEstado) => {
    if (nuevoEstado === presupuesto.estado) return
    setCambiandoEstado(true)
    try {
      await updateEstado(id, nuevoEstado)
      setPresupuesto(prev => ({ ...prev, estado: nuevoEstado }))
    } catch {
      alert('No se pudo cambiar el estado')
    } finally {
      setCambiandoEstado(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminás el presupuesto #${presupuesto.numero}? Esta acción no se puede deshacer.`)) return
    try {
      await deletePresupuesto(id)
      navigate('/historial')
    } catch {
      alert('No se pudo eliminar el presupuesto')
    }
  }

  const copiarTexto = async (texto, tipo) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(tipo)
      setTimeout(() => setCopiado(''), 2000)
    } catch {
      alert('No se pudo copiar al portapapeles')
    }
  }

  const compartirWhatsApp = () => {
    const texto = generarTextoWhatsApp(presupuesto)
    const encoded = encodeURIComponent(texto)
    const numero  = presupuesto.cliente_whatsapp?.replace(/\D/g, '') || ''
    window.open(`https://wa.me/${numero}?text=${encoded}`, '_blank')
  }

  const handlePDF = async () => {
    setGenerandoPDF(true)
    try {
      await generatePDF(presupuesto)
    } catch {
      alert('Error al generar el PDF')
    } finally {
      setGenerandoPDF(false)
    }
  }

  if (loading) return <div className={styles.page}><p className={styles.state}>Cargando...</p></div>
  if (error)   return <div className={styles.page}><p className={styles.stateError}>{error}</p></div>

  const p = presupuesto
  const descuento = p.subtotal * p.descuento_pct / 100

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Link to="/historial" className={styles.back}>← Historial</Link>
        <div className={styles.pageHeaderRow}>
          <div>
            <h1 className={styles.title}>Presupuesto #{p.numero}</h1>
            <p className={styles.subtitle}>Emitido el {formatFecha(p.fecha_emision)}</p>
          </div>
          <EstadoBadge estado={p.estado} />
        </div>
      </div>

      <div className={styles.layout}>

        {/* ── Vista principal ── */}
        <div className={styles.main}>

          {/* Cliente */}
          {(p.cliente_nombre || p.nota_cliente) && (
            <section className={styles.card}>
              {p.cliente_nombre && (
                <div className={styles.clienteBlock}>
                  <p className={styles.clienteLabel}>Para</p>
                  <p className={styles.clienteNombre}>{p.cliente_nombre}</p>
                  {p.cliente_empresa  && <p className={styles.clienteMeta}>{p.cliente_empresa}</p>}
                  {p.cliente_email    && <p className={styles.clienteMeta}>{p.cliente_email}</p>}
                  {p.cliente_whatsapp && <p className={styles.clienteMeta}>{p.cliente_whatsapp}</p>}
                </div>
              )}
              {p.fecha_vencimiento && (
                <p className={styles.vencimiento}>
                  Válido hasta: <strong>{formatFecha(p.fecha_vencimiento)}</strong>
                </p>
              )}
            </section>
          )}

          {/* Ítems */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Ítems</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thNombre}>Servicio</th>
                    <th className={styles.thNum}>Precio unit.</th>
                    <th className={styles.thCant}>Cant.</th>
                    <th className={styles.thNum}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {p.items.map(it => (
                    <tr key={it.id}>
                      <td>
                        <p className={styles.itemNombre}>{it.nombre}</p>
                        {it.descripcion && <p className={styles.itemDesc}>{it.descripcion}</p>}
                      </td>
                      <td className={styles.tdNum}>{formatCurrency(it.precio, p.moneda)}</td>
                      <td className={styles.tdNum}>{it.cantidad}</td>
                      <td className={styles.tdNum}>{formatCurrency(it.subtotal, p.moneda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className={styles.totalesWrap}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(p.subtotal, p.moneda)}</span>
              </div>
              {p.descuento_pct > 0 && (
                <div className={`${styles.totalRow} ${styles.totalDescuento}`}>
                  <span>Descuento ({p.descuento_pct}%)</span>
                  <span>− {formatCurrency(descuento, p.moneda)}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                <span>Total</span>
                <span>{formatCurrency(p.total, p.moneda)}</span>
              </div>
            </div>
          </section>

          {/* Nota */}
          {p.nota_cliente && (
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Nota al cliente</h2>
              <p className={styles.nota}>{p.nota_cliente}</p>
            </section>
          )}
        </div>

        {/* ── Sidebar acciones ── */}
        <aside className={styles.sidebar}>

          {/* Estado */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Estado</h2>
            <select
              className={styles.estadoSelect}
              value={p.estado}
              onChange={e => handleEstado(e.target.value)}
              disabled={cambiandoEstado}
            >
              {ESTADOS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Compartir */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Compartir</h2>
            <div className={styles.shareActions}>
              <button className={styles.btnWhatsApp} onClick={compartirWhatsApp}>
                <span>WhatsApp</span>
              </button>
              <button
                className={styles.btnShare}
                onClick={() => copiarTexto(generarTextoEmail(p), 'email')}
              >
                {copiado === 'email' ? '✓ Copiado' : 'Copiar texto email'}
              </button>
              <button
                className={styles.btnShare}
                onClick={() => copiarTexto(generarTextoWhatsApp(p), 'wa')}
              >
                {copiado === 'wa' ? '✓ Copiado' : 'Copiar texto WhatsApp'}
              </button>
              <button
                className={styles.btnShare}
                onClick={handlePDF}
                disabled={generandoPDF}
              >
                {generandoPDF ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
            </div>
          </div>

          {/* Editar / Eliminar */}
          <div className={styles.card}>
            <Link to={`/presupuestos/${id}/editar`} className={styles.btnEdit}>
              Editar presupuesto
            </Link>
            <button className={styles.btnDelete} onClick={handleDelete}>
              Eliminar presupuesto
            </button>
          </div>

        </aside>
      </div>
    </div>
  )
}
