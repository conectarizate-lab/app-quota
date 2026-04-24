import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import PasswordInput from '../components/UI/PasswordInput'
import styles from './Register.module.css'

export default function Register() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm] = useState({
    nombre:          '',
    empresa:         '',
    email:           '',
    password:        '',
    moneda_default:  'ARS',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await registerApi(form)
      login(data.data.token, data.data.usuario)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Quota</span>
          <p className={styles.brandTagline}>Creá tu cuenta gratis</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="nombre">Nombre completo *</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                required
                autoComplete="name"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="empresa">Empresa / Marca</label>
              <input
                id="empresa"
                name="empresa"
                type="text"
                value={form.empresa}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contraseña * (mínimo 8 caracteres)</label>
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="moneda_default">Moneda por defecto</label>
            <select
              id="moneda_default"
              name="moneda_default"
              value={form.moneda_default}
              onChange={handleChange}
            >
              <option value="ARS">ARS — Peso argentino</option>
              <option value="USD">USD — Dólar estadounidense</option>
              <option value="UYU">UYU — Peso uruguayo</option>
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className={styles.link}>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
