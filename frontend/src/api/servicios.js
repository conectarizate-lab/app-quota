import api from './axios'

export const getServicios    = ()         => api.get('/servicios')
export const createServicio  = (data)     => api.post('/servicios', data)
export const updateServicio  = (id, data) => api.put(`/servicios/${id}`, data)
export const deleteServicio  = (id)       => api.delete(`/servicios/${id}`)
