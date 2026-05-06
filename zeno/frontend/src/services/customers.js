import api from './api.js'

export const createCustomer = (data) =>
  api.post('/customers', data).then((res) => res.data.data)

export const getCustomers = () =>
  api.get('/customers').then((res) => res.data.data)

export const getCustomerById = (id) =>
  api.get(`/customers/${id}`).then((res) => res.data.data)

export const updateCustomer = (id, data) =>
  api.put(`/customers/${id}`, data).then((res) => res.data.data)

export const deleteCustomer = (id) =>
  api.delete(`/customers/${id}`).then((res) => res.data)
