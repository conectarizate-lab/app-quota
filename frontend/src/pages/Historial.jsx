import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPresupuestos } from '../api/presupuestos'
import { formatCurrency } from '../utils/formatCurrency'
import styles from './Historial.module.css'

const ESTADOS = ['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido']

function formatFecha(fechaISO) {
  if (!fechaISO) return '—'
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}

function EstadoBadge({ estado }) {
  return <span className={`${styles.badge} ${styles[`badge_${estado}`]}`}>{estado}</span>
}

export default function Historial() {
  const navigate = useNavigate()

  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroDesde, setFiltroDesde]   = useState('')
  const [filtroHasta, setFiltroHasta]   = useState('')

  const cargar = useCallback(async (params = {}) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getPresupuestos(params)
      setPresupuestos(data.data.presupuestos)
    } catch {
      setError('No se pudieron cargar los presupuestos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const aplicarFiltros = (e) => {
    e.preventDefault()
    const params = {}
    if (filtroEstado) params.estado = filtroEstado
    if (filtroDesde)  params.desde  = filtroDesde
    if (filtroHasta)  params.hasta  = filtroHasta
    cargar(params)
  }

  const limpiarFiltros = () => {
    setFiltroEstado('')
    setFiltroDesde('')
    setFiltroHasta('')
    cargar()
  }

  const hayFiltros = filtroEstado || filtroDesde || filtroHasta

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Historial</h1>
          <p className={styles.subtitle}>Todos tus presupuestos</p>
        </div>
        <Link to="/presupuestos/nuevo" className={styles.btnPrimary}>+ Nuevo presupuesto</Link>
      </div>

      {/* Filtros */}
      <form className={styles.filters} onSubmit={aplicarFiltros}>
        <select
          className={styles.filterSelect}
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>

        <div className={styles.filterDateGroup}>
          <input
            type="date"
            className={styles.filterInput}
            value={filtroDesde}
            onChange={e => setFiltroDesde(e.target.value)}
            title="Desde"
          />
          <span className={styles.filterSep}>—</span>
          <input
            type="date"
            className={styles.filterInput}
            value={filtroHasta}
            onChange={e => setFiltroHasta(e.target.value)}
            title="Hasta"
          />
        </div>

        <button type="submit" className={styles.btnFilter}>Buscar</button>
        {hayFiltros && (
          <button type="button" className={styles.btnClear} onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </form>

      {/* Contenido */}
      {loading && <p className={styles.state}>Cargando...</p>}
      {error   && <p className={styles.stateError}>{error}</p>}

      {!loading && !error && presupuestos.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🗂️</div>
          <p className={styles.emptyTitle}>
            {hayFiltros ? 'Sin resultados para esos filtros' : 'Todavía no creaste ningún presupuesto'}
          </p>
          <p className={styles.emptyText}>
            {hayFiltros
              ? 'Probá cambiando los filtros o limpiándolos para ver todos.'
              : 'Creá tu primer presupuesto y empezá a compartirlo con tus clientes.'
            }
          </p>
          {!hayFiltros && (
            <Link to="/presupuestos/nuevo" className={styles.btnPrimary}>+ Crear primer presupuesto</Link>
          )}
        </div>
      )}

      {!loading && presupuestos.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th className={styles.thRight}>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map(p => (
                <tr
                  key={p.id}
                  className={styles.row}
                  onClick={() => navigate(`/presupuestos/${p.id}`)}
                  title={`Ver presupuesto #${p.numero}`}
                >
                  <td className={styles.tdNumero}>#{p.numero}</td>
                  <td className={styles.tdCliente}>{p.cliente_nombre || <span className={styles.sinCliente}>Sin cliente</span>}</td>
                  <td className={styles.tdFecha}>{formatFecha(p.fecha_emision)}</td>
                  <td className={styles.tdTotal}>{formatCurrency(p.total, p.moneda)}</td>
                  <td><EstadoBadge estado={p.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.tableFooter}>
            {presupuestos.length} presupuesto{presupuestos.length !== 1 ? 's' : ''}
            {hayFiltros ? ' (filtrado)' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
