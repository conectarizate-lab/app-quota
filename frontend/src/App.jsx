import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout/Layout'

import Login            from './pages/Login'
import Register         from './pages/Register'
import Dashboard        from './pages/Dashboard'
import Servicios        from './pages/Servicios'
import Clientes         from './pages/Clientes'
import NuevoPresupuesto from './pages/NuevoPresupuesto'
import EditarPresupuesto from './pages/EditarPresupuesto'
import VerPresupuesto   from './pages/VerPresupuesto'
import Historial        from './pages/Historial'
import Configuracion    from './pages/Configuracion'

function PrivateRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="loading-screen">Cargando...</div>
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="loading-screen">Cargando...</div>
  return token ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Rutas privadas con layout */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"                    element={<Dashboard />} />
        <Route path="servicios"                    element={<Servicios />} />
        <Route path="clientes"                     element={<Clientes />} />
        <Route path="presupuestos/nuevo"            element={<NuevoPresupuesto />} />
        <Route path="presupuestos/:id/editar"       element={<EditarPresupuesto />} />
        <Route path="presupuestos/:id"              element={<VerPresupuesto />} />
        <Route path="historial"                    element={<Historial />} />
        <Route path="configuracion"                element={<Configuracion />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
