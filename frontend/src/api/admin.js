import api from './axios'

export const getUsuarios   = ()           => api.get('/admin')
export const updateUsuario = (id, data)   => api.patch(`/admin/${id}`, data)
