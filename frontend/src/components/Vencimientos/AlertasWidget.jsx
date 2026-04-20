import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAlertas } from '../../api/vencimientos'
import styles from './AlertasWidget.module.css'

export default function AlertasWidget() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAlertas()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return null

  const hayAlertas =
    data.vencidos.length > 0 ||
    data.proximos_3_dias.length > 0 ||
    data.total_pendiente_cobro > 0

  if (!hayAlertas) return null

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vencimientos</h2>
        <Link to="/vencimientos" className={styles.link}>Ver todos →</Link>
      </div>

      <div className={styles.items}>
        {data.vencidos.length > 0 && (
          <div className={`${styles.item} ${styles.rojo}`}>
            <span className={styles.count}>{data.vencidos.length}</span>
            <span className={styles.label}>
              {data.vencidos.length === 1 ? 'vencido sin cobrar' : 'vencidos sin cobrar'}
            </span>
          </div>
        )}
        {data.proximos_3_dias.length > 0 && (
          <div className={`${styles.item} ${styles.naranja}`}>
            <span className={styles.count}>{data.proximos_3_dias.length}</span>
            <span className={styles.label}>
              {data.proximos_3_dias.length === 1 ? 'vence en los próximos 3 días' : 'vencen en los próximos 3 días'}
            </span>
          </div>
        )}
        {data.total_pendiente_cobro > 0 && (
          <div className={`${styles.item} ${styles.neutro}`}>
            <span className={styles.label}>
              Pendiente de cobro: <strong>${data.total_pendiente_cobro.toLocaleString('es-AR')}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
