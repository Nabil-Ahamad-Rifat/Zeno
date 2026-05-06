import api from './api.js'

export const getSalesReport = async (params) => {
  const response = await api.get('/reports/sales', { params })
  return response.data
}

export const getStockReport = async (params) => {
  const response = await api.get('/reports/stock', { params })
  return response.data
}

export const getCustomersReport = async (params) => {
  const response = await api.get('/reports/customers', { params })
  return response.data
}

export const getProfitReport = async (params) => {
  const response = await api.get('/reports/profit', { params })
  return response.data
}

export const downloadReport = async (endpoint, params, format) => {
  const response = await api.get(`/reports/${endpoint}`, {
    params: { ...params, format },
    responseType: 'blob',
  })
  return response.data
}

export const exportToPDF = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.parentNode.removeChild(link)
}

export const exportToExcel = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.parentNode.removeChild(link)
}
