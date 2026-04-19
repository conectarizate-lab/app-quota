import api from './axios'

export const getPresupuestos    = (params)     => api.get('/presupuestos', { params })
export const createPresupuesto  = (data)       => api.post('/presupuestos', data)
export const getPresupuesto     = (id)         => api.get(`/presupuestos/${id}`)
export const updatePresupuesto  = (id, data)   => api.put(`/presupuestos/${id}`, data)
export const updateEstado       = (id, estado) => api.patch(`/presupuestos/${id}/estado`, { estado })
export const deletePresupuesto  = (id)         => api.delete(`/presupuestos/${id}`)
