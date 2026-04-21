import { useState, useEffect } from 'react'
import { getUsuarios, updateUsuario } from '../api/admin'
import styles from './Admin.module.css'

const PLAN_LABELS = { free: 'Free', pro: 'Pro' }

function diasRestantes(u) {
  if (u.plan !== 'pro' || !u.trial_expira_en) return null
  return Math.ceil((new Date(u.trial_expira_en) - Date.now()) / 86400000)
}

export default function Admin() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState({ plan: 'free', trial_expira_en: '', plan_origen: 'trial', activo: 1 })
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    try {
      const { data } = await getUsuarios()
      setUsuarios(data.data.usuarios)
    } catch {
      setError('No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (u) => {
    setEditing(u)
    setForm({
      plan:            u.plan,
      trial_expira_en: u.trial_expira_en ? u.trial_expira_en.slice(0, 10) : '',
      plan_origen:     u.plan_origen ?? 'trial',
      activo:          u.activo,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUsuario(editing.id, {
        plan:            form.plan,
        trial_expira_en: form.trial_expira_en || null,
        plan_origen:     form.plan_origen,
        activo:          form.activo,
      })
      await load()
      setEditing(null)
    } catch {
      alert('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const extenderTrial = () => {
    const nueva = new Date()
    nueva.setDate(nueva.getDate() + 30)
    setForm(f => ({ ...f, plan: 'pro', trial_expira_en: nueva.toISOString().slice(0, 10) }))
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Panel de administración</h1>
          <p className={styles.subtitle}>{usuarios.length} usuarios registrados</p>
        </div>
      </div>

      {loading && <p className={styles.state}>Cargando usuarios...</p>}
      {error   && <p className={styles.stateError}>{error}</p>}

      {!loading && !error && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre / Email</th>
                <th>Plan</th>
                <th>Trial</th>
                <th>Origen</th>
                <th>Registro</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const dias = diasRestantes(u)
                return (
                  <tr key={u.id} className={!u.activo ? styles.inactivo : ''}>
                    <td>
                      <div className={styles.nombre}>{u.nombre}</div>
                      <div className={styles.email}>{u.email}</div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.plan === 'pro' ? styles.badgePro : styles.badgeFree}`}>
                        {PLAN_LABELS[u.plan] ?? u.plan}
                      </span>
                    </td>
                    <td className={styles.tdMuted}>
                      {dias !== null
                        ? <span className={dias <= 3 ? styles.textRed : dias <= 7 ? styles.textOrange : ''}>
                            {dias > 0 ? `${dias}d restantes` : 'Vencido'}
                          </span>
                        : '—'}
                    </td>
                    <td className={styles.tdMuted}>{u.plan_origen ?? '—'}</td>
                    <td className={styles.tdMuted}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.activo ? styles.badgeActivo : styles.badgeInactivo}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.btnEdit} onClick={() => openEdit(u)}>Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className={styles.overlay} onClick={() => setEditing(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar plan — {editing.nombre}</h2>
              <button className={styles.modalClose} onClick={() => setEditing(null)}>✕</button>
            </div>
            <p className={styles.modalEmail}>{editing.email}</p>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.field}>
                <label>Plan</label>
                <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Trial vence el</label>
                <input
                  type="date"
                  value={form.trial_expira_en}
                  onChange={e => setForm(f => ({ ...f, trial_expira_en: e.target.value }))}
                />
                <button type="button" className={styles.btnSmall} onClick={extenderTrial}>
                  +30 días desde hoy
                </button>
              </div>
              <div className={styles.field}>
                <label>Origen del plan</label>
                <select value={form.plan_origen} onChange={e => setForm(f => ({ ...f, plan_origen: e.target.value }))}>
                  <option value="trial">Trial</option>
                  <option value="pago">Pago</option>
                  <option value="cortesia">Cortesía</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Estado</label>
                <select value={form.activo} onChange={e => setForm(f => ({ ...f, activo: Number(e.target.value) }))}>
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setEditing(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
