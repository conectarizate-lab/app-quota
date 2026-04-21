import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/dashboard',          label: 'Dashboard',      icon: '▦' },
  { to: '/servicios',          label: 'Mis servicios',  icon: '⊞' },
  { to: '/clientes',           label: 'Clientes',       icon: '◎' },
  { to: '/vencimientos',       label: 'Vencimientos',   icon: '◷' },
  { to: '/historial',          label: 'Historial',      icon: '≡' },
  { to: '/configuracion',      label: 'Configuración',  icon: '⚙' },
]

export default function Sidebar({ open, onClose }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoText}>Quota</span>
      </div>

      {/* Nuevo presupuesto */}
      <div className={styles.newBtnWrapper}>
        <NavLink to="/presupuestos/nuevo" className={styles.newBtn} onClick={onClose}>
          + Nuevo presupuesto
        </NavLink>
      </div>

      {/* Navegación */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + logout */}
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{usuario?.nombre}</span>
          <span className={styles.userEmail}>{usuario?.email}</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Salir
        </button>
      </div>
    </aside>
  )
}
