import api from './api.js'

export const createSale = (data) =>
  api.post('/sales', data).then((res) => res.data.data)

export const getSales = (params) =>
  api.get('/sales', { params }).then((res) => res.data.data)

export const getSaleById = (id) =>
  api.get(`/sales/${id}`).then((res) => res.data.data)

export const downloadMemoPDF = (id) =>
  api.get(`/sales/${id}/memo.pdf`, { responseType: 'blob' })
    .then((res) => res.data)

export const resendMemoEmail = (id) =>
  api.post(`/sales/${id}/resend-memo`).then((res) => res.data)
