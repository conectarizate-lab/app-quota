import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getClientes } from '../api/clientes'
import { getServicios } from '../api/servicios'
import { getPresupuesto, updatePresupuesto } from '../api/presupuestos'
import { formatCurrency } from '../utils/formatCurrency'
import styles from './NuevoPresupuesto.module.css'

let _key = 100
const newItem = (overrides = {}) => ({
  key:         _key++,
  servicio_id: null,
  nombre:      '',
  descripcion: '',
  precio:      '',
  cantidad:    1,
  ...overrides,
})

export default function EditarPresupuesto() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [clientes, setClientes]   = useState([])
  const [servicios, setServicios] = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [numero, setNumero]       = useState('')

  const [clienteId, setClienteId]       = useState('')
  const [moneda, setMoneda]             = useState('ARS')
  const [descuentoPct, setDescuentoPct] = useState('')
  const [notaCliente, setNotaCliente]   = useState('')
  const [fechaVenc, setFechaVenc]       = useState('')
  const [items, setItems]               = useState([])

  useEffect(() => {
    Promise.all([getClientes(), getServicios(), getPresupuesto(id)])
      .then(([c, s, p]) => {
        setClientes(c.data.data.clientes)
        setServicios(s.data.data.servicios)

        const pres = p.data.data.presupuesto
        setNumero(pres.numero)
        setClienteId(pres.cliente_id ? String(pres.cliente_id) : '')
        setMoneda(pres.moneda)
        setDescuentoPct(pres.descuento_pct > 0 ? String(pres.descuento_pct) : '')
        setNotaCliente(pres.nota_cliente || '')
        setFechaVenc(pres.fecha_vencimiento || '')
        setItems(
          (pres.items || []).map(it => newItem({
            servicio_id:  it.servicio_id,
            nombre:       it.nombre,
            descripcion:  it.descripcion || '',
            precio:       it.precio,
            cantidad:     it.cantidad,
          }))
        )
      })
      .catch(() => setError('No se pudo cargar el presupuesto'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Totales en tiempo real ───────────────────────────────
  const subtotal  = items.reduce(
    (sum, it) => sum + (parseFloat(it.precio) || 0) * (parseInt(it.cantidad) || 1), 0
  )
  const descuento = subtotal * (parseFloat(descuentoPct) || 0) / 100
  const total     = subtotal - descuento

  // ── Handlers ítems ──────────────────────────────────────
  const updateItem = (key, field, value) =>
    setItems(prev => prev.map(it => it.key === key ? { ...it, [field]: value } : it))

  const removeItem = (key) =>
    setItems(prev => prev.filter(it => it.key !== key))

  const addBlankItem = () =>
    setItems(prev => [...prev, newItem()])

  const addFromCatalog = (e) => {
    const servicioId = parseInt(e.target.value)
    e.target.value = ''
    if (!servicioId) return
    const s = servicios.find(x => x.id === servicioId)
    if (!s) return
    setItems(prev => [...prev, newItem({
      servicio_id:  s.id,
      nombre:       s.nombre,
      descripcion:  s.descripcion || '',
      precio:       s.precio,
    })])
  }

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validItems = items.filter(it => it.nombre.trim())
    if (validItems.length === 0)
      return setError('Agregá al menos un ítem con nombre')
    if (validItems.some(it => it.precio === '' || isNaN(parseFloat(it.precio))))
      return setError('Todos los ítems deben tener un precio válido')

    setSaving(true)
    try {
      const payload = {
        cliente_id:        clienteId ? parseInt(clienteId) : null,
        moneda,
        descuento_pct:     parseFloat(descuentoPct) || 0,
        nota_cliente:      notaCliente,
        fecha_vencimiento: fechaVenc || null,
        items: validItems.map(it => ({
          servicio_id:  it.servicio_id,
          nombre:       it.nombre,
          descripcion:  it.descripcion,
          precio:       parseFloat(it.precio),
          cantidad:     parseInt(it.cantidad) || 1,
        })),
      }
      await updatePresupuesto(id, payload)
      navigate(`/presupuestos/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los cambios')
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.page}><p className={styles.state}>Cargando...</p></div>
  if (error && items.length === 0) return <div className={styles.page}><p className={styles.stateError}>{error}</p></div>

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Link to={`/presupuestos/${id}`} className={styles.back}>← Volver al presupuesto</Link>
        <h1 className={styles.title}>Editar presupuesto #{numero}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.layout}>

          {/* ── Columna principal ── */}
          <div className={styles.main}>

            {/* Datos generales */}
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Datos generales</h2>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="cliente">Cliente</label>
                  <select id="cliente" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">Sin cliente asignado</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}{c.empresa ? ` — ${c.empresa}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="moneda">Moneda</label>
                  <select id="moneda" value={moneda} onChange={e => setMoneda(e.target.value)}>
                    <option value="ARS">ARS — Peso argentino</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="UYU">UYU — Peso uruguayo</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Ítems */}
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Ítems</h2>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thNombre}>Nombre</th>
                      <th className={styles.thDesc}>Descripción</th>
                      <th className={styles.thNum}>Precio</th>
                      <th className={styles.thCant}>Cant.</th>
                      <th className={styles.thSub}>Subtotal</th>
                      <th className={styles.thDel}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => {
                      const sub = (parseFloat(it.precio) || 0) * (parseInt(it.cantidad) || 1)
                      return (
                        <tr key={it.key}>
                          <td>
                            <input
                              className={styles.cellInput}
                              value={it.nombre}
                              onChange={e => updateItem(it.key, 'nombre', e.target.value)}
                              placeholder="Nombre"
                            />
                          </td>
                          <td>
                            <input
                              className={styles.cellInput}
                              value={it.descripcion}
                              onChange={e => updateItem(it.key, 'descripcion', e.target.value)}
                              placeholder="Descripción (opcional)"
                            />
                          </td>
                          <td>
                            <input
                              className={`${styles.cellInput} ${styles.cellRight}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.precio}
                              onChange={e => updateItem(it.key, 'precio', e.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <input
                              className={`${styles.cellInput} ${styles.cellRight} ${styles.cellCant}`}
                              type="number"
                              min="1"
                              step="1"
                              value={it.cantidad}
                              onChange={e => updateItem(it.key, 'cantidad', e.target.value)}
                            />
                          </td>
                          <td className={styles.tdSub}>
                            {formatCurrency(sub, moneda)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.btnRemove}
                              onClick={() => removeItem(it.key)}
                              disabled={items.length === 1}
                              aria-label="Eliminar ítem"
                            >×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.itemActions}>
                {servicios.length > 0 && (
                  <select className={styles.catalogSelect} value="" onChange={addFromCatalog}>
                    <option value="">+ Agregar del catálogo...</option>
                    {servicios.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} — {formatCurrency(s.precio, s.moneda)}
                      </option>
                    ))}
                  </select>
                )}
                <button type="button" className={styles.btnOutline} onClick={addBlankItem}>
                  + Ítem personalizado
                </button>
              </div>
            </section>

            {/* Nota + Fecha */}
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Detalles adicionales</h2>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="nota">Nota al cliente</label>
                  <textarea
                    id="nota"
                    value={notaCliente}
                    onChange={e => setNotaCliente(e.target.value)}
                    placeholder="Condiciones de pago, plazos, aclaraciones..."
                    rows={4}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="fechaVenc">Fecha de vencimiento</label>
                  <input
                    id="fechaVenc"
                    type="date"
                    value={fechaVenc}
                    onChange={e => setFechaVenc(e.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ── Sidebar totales ── */}
          <aside className={styles.sidebar}>
            <div className={`${styles.card} ${styles.sidebarCard}`}>
              <h2 className={styles.sectionTitle}>Resumen</h2>

              <div className={styles.field}>
                <label htmlFor="descuento">Descuento (%)</label>
                <input
                  id="descuento"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={descuentoPct}
                  onChange={e => setDescuentoPct(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className={styles.totales}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, moneda)}</span>
                </div>
                {descuento > 0 && (
                  <div className={`${styles.totalRow} ${styles.totalDescuento}`}>
                    <span>Descuento ({parseFloat(descuentoPct)}%)</span>
                    <span>− {formatCurrency(descuento, moneda)}</span>
                  </div>
                )}
                <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                  <span>Total</span>
                  <span>{formatCurrency(total, moneda)}</span>
                </div>
              </div>

              {error && <p className={styles.formError}>{error}</p>}

              <div className={styles.actions}>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <Link to={`/presupuestos/${id}`} className={styles.btnCancel}>Cancelar</Link>
              </div>
            </div>
          </aside>

        </div>
      </form>
    </div>
  )
}
