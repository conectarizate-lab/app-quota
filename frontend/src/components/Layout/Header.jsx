import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Header.module.css'

const PAGE_TITLES = {
  '/dashboard':          'Dashboard',
  '/servicios':          'Mis servicios',
  '/clientes':           'Clientes',
  '/presupuestos/nuevo': 'Nuevo presupuesto',
  '/historial':          'Historial',
  '/configuracion':      'Configuración',
}

export default function Header() {
  const { pathname } = useLocation()
  const { usuario }  = useAuth()

  const title = PAGE_TITLES[pathname]
    ?? (pathname.includes('/editar') ? 'Editar presupuesto'
       : pathname.includes('/presupuestos/') ? 'Presupuesto'
       : '')

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.right}>
        <span className={styles.empresa}>{usuario?.empresa || usuario?.nombre}</span>
      </div>
    </header>
  )
}
