import { useState, useEffect } from 'react'
import { updateMe } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import styles from './Configuracion.module.css'

export default function Configuracion() {
  const { usuario } = useAuth()

  const [perfil, setPerfil] = useState({ nombre: '', empresa: '', whatsapp: '', moneda_default: 'ARS' })
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [perfilOk, setPerfilOk]         = useState(false)
  const [perfilError, setPerfilError]   = useState('')

  const [pass, setPass] = useState({ nueva: '', confirmar: '' })
  const [savingPass, setSavingPass] = useState(false)
  const [passOk, setPassOk]         = useState(false)
  const [passError, setPassError]   = useState('')

  useEffect(() => {
    if (usuario) {
      setPerfil({
        nombre:          usuario.nombre         || '',
        empresa:         usuario.empresa        || '',
        whatsapp:        usuario.whatsapp       || '',
        moneda_default:  usuario.moneda_default  || 'ARS',
      })
    }
  }, [usuario])

  const handlePerfilChange = (e) =>
    setPerfil(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handlePerfilSubmit = async (e) => {
    e.preventDefault()
    setPerfilError('')
    setPerfilOk(false)
    if (!perfil.nombre.trim()) return setPerfilError('El nombre es obligatorio')

    setSavingPerfil(true)
    try {
      await updateMe({
        nombre:         perfil.nombre,
        empresa:        perfil.empresa,
        whatsapp:       perfil.whatsapp,
        moneda_default: perfil.moneda_default,
      })
      setPerfilOk(true)
      setTimeout(() => setPerfilOk(false), 3000)
    } catch (err) {
      setPerfilError(err.response?.data?.message || 'Error al guardar los cambios')
    } finally {
      setSavingPerfil(false)
    }
  }

  const handlePassChange = (e) =>
    setPass(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handlePassSubmit = async (e) => {
    e.preventDefault()
    setPassError('')
    setPassOk(false)
    if (!pass.nueva) return setPassError('Ingresá la nueva contraseña')
    if (pass.nueva.length < 8) return setPassError('La contraseña debe tener al menos 8 caracteres')
    if (pass.nueva !== pass.confirmar) return setPassError('Las contraseñas no coinciden')

    setSavingPass(true)
    try {
      await updateMe({ password: pass.nueva })
      setPass({ nueva: '', confirmar: '' })
      setPassOk(true)
      setTimeout(() => setPassOk(false), 3000)
    } catch (err) {
      setPassError(err.response?.data?.message || 'Error al cambiar la contraseña')
    } finally {
      setSavingPass(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Configuración</h1>
        <p className={styles.subtitle}>Administrá tu perfil y preferencias</p>
      </div>

      <div className={styles.sections}>

        {/* ── Perfil ── */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Datos de perfil</h2>

          <form onSubmit={handlePerfilSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="nombre">Nombre *</label>
              <input
                id="nombre"
                name="nombre"
                value={perfil.nombre}
                onChange={handlePerfilChange}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input
                value={usuario?.email || ''}
                disabled
                className={styles.inputDisabled}
              />
              <p className={styles.fieldHint}>El email no se puede cambiar.</p>
            </div>

            <div className={styles.field}>
              <label htmlFor="empresa">Empresa / Estudio</label>
              <input
                id="empresa"
                name="empresa"
                value={perfil.empresa}
                onChange={handlePerfilChange}
                placeholder="Nombre de tu empresa o estudio"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="whatsapp">WhatsApp / Teléfono</label>
              <input
                id="whatsapp"
                name="whatsapp"
                value={perfil.whatsapp}
                onChange={handlePerfilChange}
                placeholder="+54 9 11 1234 5678"
              />
              <p className={styles.fieldHint}>Aparece en el PDF de tus presupuestos.</p>
            </div>

            <div className={styles.field}>
              <label htmlFor="moneda_default">Moneda por defecto</label>
              <select
                id="moneda_default"
                name="moneda_default"
                value={perfil.moneda_default}
                onChange={handlePerfilChange}
              >
                <option value="ARS">ARS — Peso argentino</option>
                <option value="USD">USD — Dólar</option>
                <option value="UYU">UYU — Peso uruguayo</option>
              </select>
            </div>

            {perfilError && <p className={styles.formError}>{perfilError}</p>}
            {perfilOk    && <p className={styles.formOk}>✓ Perfil actualizado correctamente</p>}

            <div className={styles.formFooter}>
              <button type="submit" className={styles.btnPrimary} disabled={savingPerfil}>
                {savingPerfil ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Contraseña ── */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Cambiar contraseña</h2>

          <form onSubmit={handlePassSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="nueva">Nueva contraseña</label>
              <input
                id="nueva"
                name="nueva"
                type="password"
                value={pass.nueva}
                onChange={handlePassChange}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmar">Confirmar contraseña</label>
              <input
                id="confirmar"
                name="confirmar"
                type="password"
                value={pass.confirmar}
                onChange={handlePassChange}
                placeholder="Repetí la nueva contraseña"
                autoComplete="new-password"
              />
            </div>

            {passError && <p className={styles.formError}>{passError}</p>}
            {passOk    && <p className={styles.formOk}>✓ Contraseña actualizada correctamente</p>}

            <div className={styles.formFooter}>
              <button type="submit" className={styles.btnPrimary} disabled={savingPass}>
                {savingPass ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  )
}
