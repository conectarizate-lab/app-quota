import { useState } from 'react'
import { generarMensajeRecordatorio } from '../../utils/vencimientoAlertas'
import { patchEstado } from '../../api/vencimientos'
import styles from './MensajeRecordatorio.module.css'

export default function MensajeRecordatorio({ vencimiento, onCerrar, onActualizado }) {
  const mensaje     = generarMensajeRecordatorio(vencimiento)
  const [copiado, setCopiado] = useState('')

  const copiar = async (texto) => {
    await navigator.clipboard.writeText(texto)
    setCopiado(texto)
    setTimeout(() => setCopiado(''), 2000)

    if (['pendiente'].includes(vencimiento.estado)) {
      try {
        const { data } = await patchEstado(vencimiento.id, { estado: 'recordatorio_enviado' })
        onActualizado?.(data.data.vencimiento)
      } catch {}
    }
  }

  const mensajeWhatsApp = mensaje.replace(/\n/g, '%0A')

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Mensaje de recordatorio</h3>
          <button className={styles.close} onClick={onCerrar}>✕</button>
        </div>

        <div className={styles.body}>
          <pre className={styles.mensaje}>{mensaje}</pre>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.btnWsp}
            onClick={() => copiar(mensaje)}
          >
            {copiado === mensaje ? '¡Copiado!' : 'Copiar para WhatsApp'}
          </button>
          <button
            className={styles.btnPlain}
            onClick={() => copiar(mensaje)}
          >
            Copiar texto
          </button>
          <button className={styles.btnCerrar} onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
