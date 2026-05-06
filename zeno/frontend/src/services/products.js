import api from './api.js'

export const createProduct = (data) =>
  api.post('/products', data).then((res) => res.data.data)

export const getProducts = () =>
  api.get('/products').then((res) => res.data.data)

export const getProductById = (id) =>
  api.get(`/products/${id}`).then((res) => res.data.data)

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data).then((res) => res.data.data)

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((res) => res.data)
