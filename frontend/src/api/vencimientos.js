import api from './axios'

export const getVencimientos   = (params)     => api.get('/vencimientos', { params })
export const createVencimiento = (data)       => api.post('/vencimientos', data)
export const getVencimiento    = (id)         => api.get(`/vencimientos/${id}`)
export const updateVencimiento = (id, data)   => api.put(`/vencimientos/${id}`, data)
export const patchEstado       = (id, data)   => api.patch(`/vencimientos/${id}/estado`, data)
export const deleteVencimiento = (id)         => api.delete(`/vencimientos/${id}`)
export const getAlertas        = ()           => api.get('/vencimientos/alertas')
