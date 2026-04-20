import { useState, useEffect } from 'react'
import { getClientes } from '../../api/clientes'
import styles from './FormVencimiento.module.css'

const EMPTY = {
  tipo: 'cobro',
  concepto: '',
  cliente_id: '',
  monto: '',
  moneda: 'ARS',
  fecha_vencimiento: '',
  recurrencia: 'unico',
  notas: '',
}

export default function FormVencimiento({ inicial, onGuardar, onCerrar, loading }) {
  const [form, setForm]       = useState({ ...EMPTY, ...(inicial ?? {}) })
  const [clientes, setClientes] = useState([])

  useEffect(() => {
    getClientes()
      .then(({ data }) => setClientes(data.data.clientes ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setForm({ ...EMPTY, ...(inicial ?? {}) })
  }, [inicial])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onGuardar({
      ...form,
      monto:      form.monto !== '' ? parseFloat(form.monto) : null,
      cliente_id: form.tipo === 'cobro' && form.cliente_id ? parseInt(form.cliente_id) : null,
    })
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>{inicial ? 'Editar vencimiento' : 'Nuevo vencimiento'}</h3>
          <button className={styles.close} onClick={onCerrar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Tipo */}
          <div className={styles.field}>
            <label>Tipo</label>
            <div className={styles.toggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${form.tipo === 'cobro' ? styles.toggleActive : ''}`}
                onClick={() => set('tipo', 'cobro')}
              >
                Cobro
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${form.tipo === 'pago' ? styles.toggleActive : ''}`}
                onClick={() => set('tipo', 'pago')}
              >
                Pago
              </button>
            </div>
          </div>

          {/* Concepto */}
          <div className={styles.field}>
            <label htmlFor="concepto">Concepto</label>
            <input
              id="concepto"
              type="text"
              value={form.concepto}
              onChange={(e) => set('concepto', e.target.value)}
              placeholder="Ej: Sesión individual, Cuota mensual..."
              required
            />
          </div>

          {/* Cliente (solo cobros) */}
          {form.tipo === 'cobro' && (
            <div className={styles.field}>
              <label htmlFor="cliente_id">Cliente (opcional)</label>
              <select id="cliente_id" value={form.cliente_id} onChange={(e) => set('cliente_id', e.target.value)}>
                <option value="">Sin cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Monto + Moneda */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="monto">Monto (opcional)</label>
              <input
                id="monto"
                type="number"
                min="0"
                step="0.01"
                value={form.monto}
                onChange={(e) => set('monto', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="moneda">Moneda</label>
              <select id="moneda" value={form.moneda} onChange={(e) => set('moneda', e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
                <option value="UYU">UYU</option>
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div className={styles.field}>
            <label htmlFor="fecha_vencimiento">Fecha de vencimiento</label>
            <input
              id="fecha_vencimiento"
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => set('fecha_vencimiento', e.target.value)}
              required
            />
          </div>

          {/* Recurrencia */}
          <div className={styles.field}>
            <label htmlFor="recurrencia">Recurrencia</label>
            <select id="recurrencia" value={form.recurrencia} onChange={(e) => set('recurrencia', e.target.value)}>
              <option value="unico">Único</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          {/* Notas */}
          <div className={styles.field}>
            <label htmlFor="notas">Notas (opcional)</label>
            <textarea
              id="notas"
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              rows={2}
              placeholder="Notas internas..."
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onCerrar}>Cancelar</button>
            <button type="submit" className={styles.btnGuardar} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
