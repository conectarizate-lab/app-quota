import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPresupuestos } from '../api/presupuestos'
import { getServicios }    from '../api/servicios'
import { getClientes }     from '../api/clientes'
import { useAuth }         from '../hooks/useAuth'
import { formatCurrency }  from '../utils/formatCurrency'
import AlertasWidget       from '../components/Vencimientos/AlertasWidget'
import styles              from './Dashboard.module.css'

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

function Onboarding({ hasServicios, hasClientes, hasPresupuestos }) {
  const steps = [
    {
      num: 1,
      done: hasServicios,
      icon: '⊞',
      title: 'Cargá tus servicios',
      desc: 'Creá tu catálogo de servicios o productos para agregarlos rápido a cualquier presupuesto.',
      cta: 'Ir a Mis servicios',
      to: '/servicios',
    },
    {
      num: 2,
      done: hasClientes,
      icon: '◎',
      title: 'Agregá un cliente',
      desc: 'Guardá los datos de tus clientes para asignarlos a cada presupuesto y tener todo organizado.',
      cta: 'Ir a Clientes',
      to: '/clientes',
    },
    {
      num: 3,
      done: hasPresupuestos,
      icon: '▦',
      title: 'Creá tu primer presupuesto',
      desc: 'Armá un presupuesto profesional y compartilo por WhatsApp o PDF en segundos.',
      cta: 'Crear presupuesto',
      to: '/presupuestos/nuevo',
    },
  ]

  const completados = steps.filter(s => s.done).length

  return (
    <div className={styles.onboarding}>
      <div className={styles.onboardingHeader}>
        <div>
          <h2 className={styles.onboardingTitle}>Empezá en 3 pasos simples</h2>
          <p className={styles.onboardingSub}>{completados} de 3 pasos completados</p>
        </div>
        <div className={styles.onboardingProgress}>
          <div
            className={styles.onboardingBar}
            style={{ width: `${(completados / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className={styles.stepsGrid}>
        {steps.map((step) => (
          <div
            key={step.num}
            className={`${styles.stepCard} ${step.done ? styles.stepDone : ''}`}
          >
            <div className={styles.stepTop}>
              <div className={`${styles.stepNum} ${step.done ? styles.stepNumDone : ''}`}>
                {step.done ? '✓' : step.num}
              </div>
              <span className={styles.stepIcon}>{step.icon}</span>
            </div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.desc}</p>
            {!step.done && (
              <Link to={step.to} className={styles.stepCta}>{step.cta} →</Link>
            )}
            {step.done && (
              <span className={styles.stepCompletado}>Completado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { usuario }                       = useAuth()
  const [presupuestos, setPresupuestos]   = useState([])
  const [servicios,    setServicios]      = useState([])
  const [clientes,     setClientes]       = useState([])
  const [loading,      setLoading]        = useState(true)
  const [error,        setError]          = useState('')

  useEffect(() => {
    Promise.all([
      getPresupuestos(),
      getServicios(),
      getClientes(),
    ])
      .then(([rP, rS, rC]) => {
        setPresupuestos(rP.data.data.presupuestos)
        setServicios(rS.data.data.servicios)
        setClientes(rC.data.data.clientes)
      })
      .catch(() => setError('No se pudieron cargar los datos'))
      .finally(() => setLoading(false))
  }, [])

  const mes         = mesActual()
  const total       = presupuestos.length
  const aceptados   = presupuestos.filter(p => p.estado === 'aceptado')
  const pendientes  = presupuestos.filter(p => p.estado === 'borrador' || p.estado === 'enviado')
  const esteMes     = presupuestos.filter(p => p.fecha_emision?.startsWith(mes))
  const ultimos     = presupuestos.slice(0, 5)
  const nombre      = usuario?.nombre?.split(' ')[0] || 'ahí'

  const hasServicios    = servicios.length > 0
  const hasClientes     = clientes.length > 0
  const hasPresupuestos = presupuestos.length > 0
  const showOnboarding  = !loading && !hasPresupuestos

  const facturadoMes = aceptados
    .filter(p => p.fecha_emision?.startsWith(mes))
    .reduce((acc, p) => {
      acc[p.moneda] = (acc[p.moneda] || 0) + parseFloat(p.total)
      return acc
    }, {})

  const facturadoTexto = Object.entries(facturadoMes)
    .map(([moneda, monto]) => formatCurrency(monto, moneda))
    .join(' + ') || null

  return (
    <div className={styles.page}>

      <div className={styles.welcome}>
        <div>
          <h1 className={styles.title}>Hola, {nombre} 👋</h1>
          <p className={styles.subtitle}>
            {usuario?.empresa ? `${usuario.empresa} · ` : ''}
            {showOnboarding ? 'Bienvenido a Quota' : 'Acá está el resumen de tu actividad'}
          </p>
        </div>
        {!showOnboarding && (
          <Link to="/presupuestos/nuevo" className={styles.btnPrimary}>+ Nuevo presupuesto</Link>
        )}
      </div>

      {error && <p className={styles.stateError}>{error}</p>}

      {/* Onboarding — solo cuando no hay presupuestos */}
      {showOnboarding && (
        <Onboarding
          hasServicios={hasServicios}
          hasClientes={hasClientes}
          hasPresupuestos={hasPresupuestos}
        />
      )}

      {/* Dashboard normal — solo cuando ya hay presupuestos */}
      {!showOnboarding && (
        <>
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

          <AlertasWidget />

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Últimos presupuestos</h2>
              <Link to="/historial" className={styles.sectionLink}>Ver todos →</Link>
            </div>
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
          </div>
        </>
      )}

    </div>
  )
}
