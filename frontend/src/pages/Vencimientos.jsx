import { useState, useEffect, useCallback } from 'react'
import { getVencimientos, createVencimiento, updateVencimiento, deleteVencimiento, patchEstado } from '../api/vencimientos'
import VencimientoCard      from '../components/Vencimientos/VencimientoCard'
import FormVencimiento      from '../components/Vencimientos/FormVencimiento'
import MensajeRecordatorio  from '../components/Vencimientos/MensajeRecordatorio'
import styles from './Vencimientos.module.css'

export default function Vencimientos() {
  const [tab, setTab]           = useState('cobro')
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const [filtroEstado, setFiltroEstado] = useState('')
  const [desde, setDesde]               = useState('')
  const [hasta, setHasta]               = useState('')

  const [modalForm, setModalForm]   = useState(false)
  const [editando, setEditando]     = useState(null)
  const [recordatorio, setRecordatorio] = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    const params = { tipo: tab }
    if (filtroEstado) params.estado = filtroEstado
    if (desde)        params.desde  = desde
    if (hasta)        params.hasta  = hasta
    getVencimientos(params)
      .then(({ data }) => setItems(data.data.vencimientos))
      .catch(() => setError('No se pudieron cargar los vencimientos'))
      .finally(() => setLoading(false))
  }, [tab, filtroEstado, desde, hasta])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo = () => { setEditando(null); setModalForm(true) }
  const abrirEditar = (v) => { setEditando(v); setModalForm(true) }
  const cerrarForm  = () => { setModalForm(false); setEditando(null) }

  const guardar = async (data) => {
    setSaving(true)
    setError('')
    try {
      if (editando) {
        await updateVencimiento(editando.id, data)
      } else {
        await createVencimiento(data)
      }
      cerrarForm()
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este vencimiento?')) return
    try {
      await deleteVencimiento(id)
      cargar()
    } catch {
      setError('Error al eliminar')
    }
  }

  const marcarCobrado = async (v) => {
    const estado = v.tipo === 'cobro' ? 'cobrado' : 'pagado'
    const label  = v.tipo === 'cobro' ? 'cobrado' : 'pagado'
    if (!window.confirm(`¿Marcar como ${label}?`)) return
    try {
      await patchEstado(v.id, { estado, fecha_pago: new Date().toISOString().split('T')[0] })
      cargar()
    } catch {
      setError('Error al actualizar el estado')
    }
  }

  const actualizarEnLista = (actualizado) => {
    setItems(prev => prev.map(i => i.id === actualizado.id ? actualizado : i))
  }

  // Totales de pendientes
  const pendientes = items.filter(v => ['pendiente', 'recordatorio_enviado'].includes(v.estado))
  const totalPorMoneda = pendientes.reduce((acc, v) => {
    if (!v.monto) return acc
    acc[v.moneda] = (acc[v.moneda] || 0) + parseFloat(v.monto)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Vencimientos</h1>
          <p className={styles.subtitle}>Controlá tus cobros y pagos</p>
        </div>
        <button className={styles.btnAgregar} onClick={abrirNuevo}>+ Agregar</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'cobro' ? styles.tabActive : ''}`}
          onClick={() => setTab('cobro')}
        >
          Cobros
        </button>
        <button
          className={`${styles.tab} ${tab === 'pago' ? styles.tabActive : ''}`}
          onClick={() => setTab('pago')}
        >
          Pagos
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filtros}>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles.select}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="recordatorio_enviado">Recordatorio enviado</option>
          <option value="cobrado">Cobrado</option>
          <option value="pagado">Pagado</option>
          <option value="vencido">Vencido</option>
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={styles.dateInput} title="Desde" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={styles.dateInput} title="Hasta" />
        {(filtroEstado || desde || hasta) && (
          <button className={styles.btnLimpiar} onClick={() => { setFiltroEstado(''); setDesde(''); setHasta('') }}>
            Limpiar
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Lista */}
      {loading && <p className={styles.state}>Cargando...</p>}

      {!loading && items.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No hay {tab === 'cobro' ? 'cobros' : 'pagos'} registrados</p>
          <p className={styles.emptyText}>
            {tab === 'cobro'
              ? 'Agregá lo que te tienen que pagar para no perder ningún cobro.'
              : 'Agregá tus pagos recurrentes (hosting, herramientas, etc.) para tenerlos bajo control.'}
          </p>
          <button className={styles.btnAgregar} onClick={abrirNuevo}>+ Agregar</button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className={styles.lista}>
            {items.map(v => (
              <VencimientoCard
                key={v.id}
                vencimiento={v}
                onEditar={abrirEditar}
                onEliminar={eliminar}
                onRecordatorio={setRecordatorio}
                onMarcarCobrado={marcarCobrado}
              />
            ))}
          </div>

          {Object.keys(totalPorMoneda).length > 0 && (
            <div className={styles.resumen}>
              <span className={styles.resumenLabel}>Total pendiente:</span>
              {Object.entries(totalPorMoneda).map(([moneda, total]) => (
                <span key={moneda} className={styles.resumenMonto}>
                  ${total.toLocaleString('es-AR')} {moneda}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal formulario */}
      {modalForm && (
        <FormVencimiento
          inicial={editando ? {
            tipo:               editando.tipo,
            concepto:           editando.concepto,
            cliente_id:         editando.cliente_id ?? '',
            monto:              editando.monto ?? '',
            moneda:             editando.moneda,
            fecha_vencimiento:  editando.fecha_vencimiento,
            recurrencia:        editando.recurrencia,
            notas:              editando.notas ?? '',
          } : null}
          onGuardar={guardar}
          onCerrar={cerrarForm}
          loading={saving}
        />
      )}

      {/* Modal recordatorio */}
      {recordatorio && (
        <MensajeRecordatorio
          vencimiento={recordatorio}
          onCerrar={() => setRecordatorio(null)}
          onActualizado={actualizarEnLista}
        />
      )}
    </div>
  )
}
