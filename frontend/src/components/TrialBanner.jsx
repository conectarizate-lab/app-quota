import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import styles from './TrialBanner.module.css'

export default function TrialBanner() {
  const { usuario } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null
  if (!usuario) return null
  if (usuario.plan !== 'pro' || !usuario.trial_expira_en) return null

  const diasRestantes = Math.ceil((new Date(usuario.trial_expira_en) - Date.now()) / 86400000)
  if (diasRestantes <= 0) return null

  const waLink = 'https://wa.me/5492215450899?text=' + encodeURIComponent('Hola! Quiero actualizar mi plan de Quota a Pro.')
  const urgent = diasRestantes <= 3
  const warn   = diasRestantes <= 7

  return (
    <div className={`${styles.banner} ${urgent ? styles.urgent : warn ? styles.warn : styles.info}`}>
      <span className={styles.text}>
        {urgent
          ? `⚠️ Tu prueba Pro vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}. ¡Actualizá ahora para no perder el acceso!`
          : `Tu prueba Pro vence en ${diasRestantes} días.`
        }
      </span>
      <a href={waLink} target="_blank" rel="noreferrer" className={styles.cta}>
        Quiero seguir con Pro
      </a>
      <button className={styles.dismiss} onClick={() => setDismissed(true)} aria-label="Cerrar">✕</button>
    </div>
  )
}
