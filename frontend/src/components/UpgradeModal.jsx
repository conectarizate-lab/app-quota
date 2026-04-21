import { useAuth } from '../hooks/useAuth'
import styles from './UpgradeModal.module.css'

const RECURSO_LABELS = {
  presupuestos: { label: 'presupuestos', limite: 2 },
  clientes:     { label: 'clientes',     limite: 3 },
  servicios:    { label: 'servicios',    limite: 5 },
  vencimientos: { label: 'vencimientos', limite: 3 },
}

export default function UpgradeModal() {
  const { upgradeModal, hideUpgrade } = useAuth()
  if (!upgradeModal.visible) return null

  const info    = RECURSO_LABELS[upgradeModal.recurso] ?? { label: upgradeModal.recurso, limite: upgradeModal.limite }
  const waLink  = 'https://wa.me/5492215450899?text=' + encodeURIComponent('Hola! Quiero actualizar mi plan de Quota a Pro.')

  return (
    <div className={styles.overlay} onClick={hideUpgrade}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={hideUpgrade} aria-label="Cerrar">✕</button>
        <div className={styles.icon}>🚀</div>
        <h2 className={styles.title}>Límite del plan Free alcanzado</h2>
        <p className={styles.text}>
          En el plan gratuito podés tener hasta <strong>{info.limite} {info.label}</strong>.
          Pasá a <strong>Pro</strong> para tener acceso ilimitado a {info.label}, más clientes,
          servicios, presupuestos y vencimientos.
        </p>
        <div className={styles.benefits}>
          <p className={styles.benefitsTitle}>Con Pro obtenés:</p>
          <ul>
            <li>Presupuestos, clientes, servicios y vencimientos ilimitados</li>
            <li>Soporte prioritario por WhatsApp</li>
            <li>Acceso a todas las funciones futuras</li>
          </ul>
        </div>
        <a href={waLink} target="_blank" rel="noreferrer" className={styles.btnUpgrade} onClick={hideUpgrade}>
          Quiero ser Pro — Escribinos por WhatsApp
        </a>
        <button className={styles.btnCancel} onClick={hideUpgrade}>Ahora no</button>
      </div>
    </div>
  )
}
