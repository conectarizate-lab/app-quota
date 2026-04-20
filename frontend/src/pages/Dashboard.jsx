import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPresupuestos } from '../api/presupuestos'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/formatCurrency'
import AlertasWidget from '../components/Vencimientos/AlertasWidget'
import styles from './Dashboard.module.css'

const ESTADOS_COLOR = {
  borrador:  'badge_borrador',
  enviado:   'badge_enviado',
  aceptado:  'badge_aceptado',
  rechazado: 'badge_rechazado',
  vencido:   'badge_vencido',
}

function formatFecha(fechaISO) {
  if (!fechaISO) return '—'
  const [y, m, d] = fechaISO.split('-')
  return `${d}/${m}/${y}`
}

function mesActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

export default function Dashboard() {
  const { usuario }                       = useAuth()
  const [presupuestos, setPresupuestos]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  useEffect(() => {
    getPresupuestos()
      .then(({ data }) => setPresupuestos(data.data.presupuestos))
      .catch(() => setError('No se pudieron cargar los datos'))
      .finally(() => setLoading(false))
  }, [])

  // ── Métricas ─────────────────────────────────────────────
  const mes = mesActual()

  const total      = presupuestos.length
  const aceptados  = presupuestos.filter(p => p.estado === 'aceptado')
  const pendientes = presupuestos.filter(p => p.estado === 'borrador' || p.estado === 'enviado')
  const esteMes    = presupuestos.filter(p => p.fecha_emision?.startsWith(mes))

  // Total facturado este mes: agrupar por moneda
  const facturadoMes = aceptados
    .filter(p => p.fecha_emision?.startsWith(mes))
    .reduce((acc, p) => {
      acc[p.moneda] = (acc[p.moneda] || 0) + parseFloat(p.total)
      return acc
    }, {})

  const facturadoTexto = Object.entries(facturadoMes)
    .map(([moneda, monto]) => formatCurrency(monto, moneda))
    .join(' + ') || null

  // Últimos 5
  const ultimos = presupuestos.slice(0, 5)

  const nombre = usuario?.nombre?.split(' ')[0] || 'ahí'

  return (
    <div className={styles.page}>

      {/* Bienvenida */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.title}>Hola, {nombre} 👋</h1>
          <p className={styles.subtitle}>
            {usuario?.empresa ? `${usuario.empresa} · ` : ''}
            Acá está el resumen de tu actividad
          </p>
        </div>
        <Link to="/presupuestos/nuevo" className={styles.btnPrimary}>+ Nuevo presupuesto</Link>
      </div>

      {error && <p className={styles.stateError}>{error}</p>}

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total presupuestos</p>
          <p className={styles.statValue}>{loading ? '—' : total}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Aceptados</p>
          <p className={`${styles.statValue} ${styles.statGreen}`}>{loading ? '—' : aceptados.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pendientes</p>
          <p className={`${styles.statValue} ${styles.statBlue}`}>{loading ? '—' : pendientes.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Emitidos este mes</p>
          <p className={styles.statValue}>{loading ? '—' : esteMes.length}</p>
          {!loading && facturadoTexto && (
            <p className={styles.statSub}>{facturadoTexto} facturado</p>
          )}
        </div>
      </div>

      {/* Widget de vencimientos */}
      <AlertasWidget />

      {/* Últimos presupuestos */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Últimos presupuestos</h2>
          <Link to="/historial" className={styles.sectionLink}>Ver todos →</Link>
        </div>

        {loading && <p className={styles.state}>Cargando...</p>}

        {!loading && ultimos.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Todavía no hay presupuestos</p>
            <p className={styles.emptyText}>
              Cargá tus servicios, sumá tus clientes y creá tu primer presupuesto.
            </p>
            <div className={styles.quickLinks}>
              <Link to="/servicios" className={styles.quickLink}>→ Agregar servicios</Link>
              <Link to="/clientes"  className={styles.quickLink}>→ Agregar clientes</Link>
              <Link to="/presupuestos/nuevo" className={styles.quickLink}>→ Crear presupuesto</Link>
            </div>
          </div>
        )}

        {!loading && ultimos.length > 0 && (
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
                {ultimos.map(p => (
                  <tr key={p.id} className={styles.row}>
                    <td>
                      <Link to={`/presupuestos/${p.id}`} className={styles.linkNumero}>
                        #{p.numero}
                      </Link>
                    </td>
                    <td className={styles.tdCliente}>
                      {p.cliente_nombre || <span className={styles.sinCliente}>Sin cliente</span>}
                    </td>
                    <td className={styles.tdMuted}>{formatFecha(p.fecha_emision)}</td>
                    <td className={styles.tdTotal}>{formatCurrency(p.total, p.moneda)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[ESTADOS_COLOR[p.estado]]}`}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
