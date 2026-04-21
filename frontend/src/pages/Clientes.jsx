import { useState, useEffect } from 'react'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../api/clientes'
import styles from './Clientes.module.css'

const CODIGOS = [
  { code: '+54',  label: '🇦🇷 +54'  },
  { code: '+598', label: '🇺🇾 +598' },
  { code: '+56',  label: '🇨🇱 +56'  },
  { code: '+55',  label: '🇧🇷 +55'  },
  { code: '+52',  label: '🇲🇽 +52'  },
  { code: '+57',  label: '🇨🇴 +57'  },
  { code: '+34',  label: '🇪🇸 +34'  },
  { code: '+1',   label: '🇺🇸 +1'   },
]

function parseWhatsapp(raw) {
  if (!raw) return { codigo: '+54', numero: '' }
  for (const { code } of CODIGOS) {
    if (raw.startsWith(code)) return { codigo: code, numero: raw.slice(code.length).trim() }
  }
  return { codigo: '+54', numero: raw }
}

const EMPTY_FORM = { nombre: '', email: '', whatsappCodigo: '+54', whatsappNumero: '', empresa: '', notas: '' }

export default function Clientes() {
  const [clientes,   setClientes]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState('')

  const load = async () => {
    try {
      const { data } = await getClientes()
      setClientes(data.data.clientes)
    } catch {
      setError('No se pudieron cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    const { codigo, numero } = parseWhatsapp(c.whatsapp)
    setForm({
      nombre:          c.nombre,
      email:           c.email    || '',
      whatsappCodigo:  codigo,
      whatsappNumero:  numero,
      empresa:         c.empresa  || '',
      notas:           c.notas    || '',
    })
    setFormError('')
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditing(null) }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.nombre.trim()) return setFormError('El nombre es obligatorio')

    const whatsapp = form.whatsappNumero.trim()
      ? `${form.whatsappCodigo}${form.whatsappNumero.trim()}`
      : ''

    setSaving(true)
    try {
      const payload = {
        nombre:   form.nombre,
        email:    form.email,
        whatsapp,
        empresa:  form.empresa,
        notas:    form.notas,
      }
      if (editing) {
        await updateCliente(editing.id, payload)
      } else {
        await createCliente(payload)
      }
      await load()
      closeModal()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar el cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`¿Eliminás a "${c.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteCliente(c.id)
      setClientes(prev => prev.filter(x => x.id !== c.id))
    } catch {
      alert('No se pudo eliminar el cliente')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Tus contactos para armar presupuestos</p>
        </div>
        <button className={styles.btnPrimary} onClick={openNew}>+ Nuevo cliente</button>
      </div>

      {loading && <p className={styles.state}>Cargando clientes...</p>}
      {error   && <p className={styles.stateError}>{error}</p>}

      {!loading && !error && clientes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>👥</div>
          <p className={styles.emptyTitle}>Todavía no cargaste ningún cliente</p>
          <p className={styles.emptyText}>
            Agregá tus clientes para poder asignarlos cuando crees un presupuesto.
          </p>
          <button className={styles.btnPrimary} onClick={openNew}>+ Agregar primer cliente</button>
        </div>
      )}

      {!loading && clientes.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td className={styles.tdNombre}>{c.nombre}</td>
                  <td className={styles.tdMuted}>{c.empresa || '—'}</td>
                  <td className={styles.tdMuted}>
                    {c.email
                      ? <a href={`mailto:${c.email}`}>{c.email}</a>
                      : '—'
                    }
                  </td>
                  <td className={styles.tdMuted}>
                    {c.whatsapp
                      ? <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{c.whatsapp}</a>
                      : '—'
                    }
                  </td>
                  <td className={styles.tdActions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(c)}>Editar</button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(c)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editing ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.field}>
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre del cliente o contacto"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="empresa">Empresa</label>
                <input
                  id="empresa"
                  name="empresa"
                  value={form.empresa}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa (opcional)"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div className={styles.field}>
                  <label>WhatsApp</label>
                  <div className={styles.waGroup}>
                    <select
                      name="whatsappCodigo"
                      value={form.whatsappCodigo}
                      onChange={handleChange}
                      className={styles.waSelect}
                    >
                      {CODIGOS.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input
                      name="whatsappNumero"
                      value={form.whatsappNumero}
                      onChange={handleChange}
                      placeholder="911 234 5678"
                      className={styles.waInput}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="notas">Notas</label>
                <textarea
                  id="notas"
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Información adicional sobre este cliente..."
                  rows={3}
                />
              </div>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
