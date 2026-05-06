import prisma from '../utils/prisma.js'

const createCustomer = async (req, res, next) => {
  try {
    const customer = await prisma.customer.create({
      data: req.body,
    })
    res.status(201).json({
      success: true,
      data: JSON.parse(JSON.stringify(customer)),
    })
  } catch (err) {
    next(err)
  }
}

const getCustomers = async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(customers)),
    })
  } catch (err) {
    next(err)
  }
}

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id, 10) },
    })

    if (!customer) {
      return next({
        status: 404,
        message: 'Customer not found',
      })
    }

    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(customer)),
    })
  } catch (err) {
    next(err)
  }
}

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id, 10) },
      data: req.body,
    })
    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(customer)),
    })
  } catch (err) {
    if (err.code === 'P2025') {
      return next({
        status: 404,
        message: 'Customer not found',
      })
    }
    next(err)
  }
}

const deleteCustomer = async (req, res, next) => {
  try {
    await prisma.customer.delete({
      where: { id: parseInt(req.params.id, 10) },
    })
    res.status(204).send()
  } catch (err) {
    if (err.code === 'P2025') {
      return next({
        status: 404,
        message: 'Customer not found',
      })
    }
    next(err)
  }
}

export {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
}
