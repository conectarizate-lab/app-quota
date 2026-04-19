import { useState, useEffect } from 'react'
import { getServicios, createServicio, updateServicio, deleteServicio } from '../api/servicios'
import { formatCurrency } from '../utils/formatCurrency'
import styles from './Servicios.module.css'

const EMPTY_FORM = { nombre: '', descripcion: '', precio: '', moneda: 'ARS', categoria: '' }

export default function Servicios() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      const { data } = await getServicios()
      setServicios(data.data)
    } catch {
      setError('No se pudieron cargar los servicios')
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

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      nombre:      s.nombre,
      descripcion: s.descripcion || '',
      precio:      s.precio,
      moneda:      s.moneda,
      categoria:   s.categoria || '',
    })
    setFormError('')
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    setEditing(null)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.nombre.trim()) return setFormError('El nombre es obligatorio')
    if (form.precio === '' || isNaN(form.precio) || Number(form.precio) < 0)
      return setFormError('Ingresá un precio válido')

    setSaving(true)
    try {
      const payload = { ...form, precio: Number(form.precio) }
      if (editing) {
        await updateServicio(editing.id, payload)
      } else {
        await createServicio(payload)
      }
      await load()
      closeModal()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar el servicio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s) => {
    if (!confirm(`¿Eliminás "${s.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteServicio(s.id)
      setServicios(prev => prev.filter(x => x.id !== s.id))
    } catch {
      alert('No se pudo eliminar el servicio')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Servicios</h1>
          <p className={styles.subtitle}>Tu catálogo de servicios y precios</p>
        </div>
        <button className={styles.btnPrimary} onClick={openNew}>+ Nuevo servicio</button>
      </div>

      {loading && <p className={styles.state}>Cargando servicios...</p>}
      {error   && <p className={styles.stateError}>{error}</p>}

      {!loading && !error && servicios.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <p className={styles.emptyTitle}>Todavía no cargaste ningún servicio</p>
          <p className={styles.emptyText}>
            Agregá los servicios que ofrecés para poder armar presupuestos rápidamente.
          </p>
          <button className={styles.btnPrimary} onClick={openNew}>+ Agregar primer servicio</button>
        </div>
      )}

      {!loading && servicios.length > 0 && (
        <div className={styles.grid}>
          {servicios.map(s => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardTop}>
                {s.categoria
                  ? <span className={styles.badge}>{s.categoria}</span>
                  : <span />
                }
                <div className={styles.cardActions}>
                  <button className={styles.btnEdit} onClick={() => openEdit(s)}>Editar</button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(s)}>Eliminar</button>
                </div>
              </div>
              <h3 className={styles.cardName}>{s.nombre}</h3>
              {s.descripcion && <p className={styles.cardDesc}>{s.descripcion}</p>}
              <p className={styles.cardPrice}>{formatCurrency(s.precio, s.moneda)}</p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editing ? 'Editar servicio' : 'Nuevo servicio'}
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
                  placeholder="Ej: Diseño de logo"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción opcional del servicio"
                  rows={3}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="precio">Precio *</label>
                  <input
                    id="precio"
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="moneda">Moneda</label>
                  <select id="moneda" name="moneda" value={form.moneda} onChange={handleChange}>
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="UYU">UYU</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="categoria">Categoría</label>
                <input
                  id="categoria"
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  placeholder="Ej: Diseño, Marketing, Web..."
                />
              </div>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
