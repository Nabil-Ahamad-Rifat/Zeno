import Customer from '../models/Customer.js'

const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body)
    res.status(201).json({ success: true, data: customer })
  } catch (err) {
    next(err)
  }
}

const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: customers })
  } catch (err) {
    next(err)
  }
}

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) return next({ status: 404, message: 'Customer not found' })
    res.status(200).json({ success: true, data: customer })
  } catch (err) {
    next(err)
  }
}

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!customer) return next({ status: 404, message: 'Customer not found' })
    res.status(200).json({ success: true, data: customer })
  } catch (err) {
    next(err)
  }
}

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id)
    if (!customer) return next({ status: 404, message: 'Customer not found' })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer }
