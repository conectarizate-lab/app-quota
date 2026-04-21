import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar      from './Sidebar'
import Header       from './Header'
import TrialBanner  from '../TrialBanner'
import UpgradeModal from '../UpgradeModal'
import styles       from './Layout.module.css'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Header onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <TrialBanner />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <UpgradeModal />
    </div>
  )
}
