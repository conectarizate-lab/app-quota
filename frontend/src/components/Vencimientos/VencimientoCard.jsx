import { nivelAlerta, formatFechaLegible, diasParaVencer } from '../../utils/vencimientoAlertas'
import styles from './VencimientoCard.module.css'

const NIVEL_LABEL = {
  rojo:     'Vencido',
  naranja:  'Vence pronto',
  amarillo: 'Esta semana',
  gris:     'Pendiente',
}

const ESTADO_LABEL = {
  pendiente:             'Pendiente',
  recordatorio_enviado:  'Recordatorio enviado',
  cobrado:               'Cobrado',
  pagado:                'Pagado',
  vencido:               'Vencido',
}

export default function VencimientoCard({ vencimiento, onEditar, onEliminar, onRecordatorio, onMarcarCobrado }) {
  const { concepto, cliente_nombre, monto, moneda, fecha_vencimiento, recurrencia, estado, tipo } = vencimiento
  const nivel = nivelAlerta(fecha_vencimiento, estado)
  const dias  = diasParaVencer(fecha_vencimiento)
  const isPendiente = ['pendiente', 'recordatorio_enviado'].includes(estado)

  const labelDias = isPendiente
    ? dias < 0
      ? `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
      : dias === 0
      ? 'Vence hoy'
      : `Vence en ${dias} día${dias !== 1 ? 's' : ''}`
    : null

  return (
    <div className={`${styles.card} ${nivel ? styles[`borde_${nivel}`] : ''}`}>
      <div className={styles.top}>
        <div className={styles.info}>
          <p className={styles.concepto}>{concepto}</p>
          {cliente_nombre && tipo === 'cobro' && (
            <p className={styles.cliente}>{cliente_nombre}</p>
          )}
        </div>
        <div className={styles.right}>
          {monto && (
            <p className={styles.monto}>
              ${parseFloat(monto).toLocaleString('es-AR')} <span className={styles.moneda}>{moneda}</span>
            </p>
          )}
          <p className={styles.fecha}>{formatFechaLegible(fecha_vencimiento)}</p>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.badges}>
          {nivel && isPendiente && (
            <span className={`${styles.badge} ${styles[`badge_${nivel}`]}`}>
              {labelDias ?? NIVEL_LABEL[nivel]}
            </span>
          )}
          {!isPendiente && (
            <span className={`${styles.badge} ${styles.badge_gris}`}>
              {ESTADO_LABEL[estado]}
            </span>
          )}
          {recurrencia !== 'unico' && (
            <span className={`${styles.badge} ${styles.badge_recurrencia}`}>
              {recurrencia}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          {isPendiente && tipo === 'cobro' && (
            <button className={styles.btnRecordatorio} onClick={() => onRecordatorio(vencimiento)}>
              Recordatorio
            </button>
          )}
          {isPendiente && (
            <button className={styles.btnCobrar} onClick={() => onMarcarCobrado(vencimiento)}>
              {tipo === 'cobro' ? 'Marcar cobrado' : 'Marcar pagado'}
            </button>
          )}
          <button className={styles.btnEditar} onClick={() => onEditar(vencimiento)}>Editar</button>
          <button className={styles.btnEliminar} onClick={() => onEliminar(vencimiento.id)}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}
