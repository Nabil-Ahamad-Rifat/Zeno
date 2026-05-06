import prisma from '../utils/prisma.js'

const createProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
    })
    res.status(201).json({
      success: true,
      data: JSON.parse(JSON.stringify(product)),
    })
  } catch (err) {
    next(err)
  }
}

const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(products)),
    })
  } catch (err) {
    next(err)
  }
}

const getProductById = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id, 10) },
    })

    if (!product) {
      return next({
        status: 404,
        message: 'Product not found',
      })
    }

    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(product)),
    })
  } catch (err) {
    next(err)
  }
}

const updateProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id, 10) },
      data: req.body,
    })
    res.status(200).json({
      success: true,
      data: JSON.parse(JSON.stringify(product)),
    })
  } catch (err) {
    if (err.code === 'P2025') {
      return next({
        status: 404,
        message: 'Product not found',
      })
    }
    next(err)
  }
}

const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.delete({
      where: { id: parseInt(req.params.id, 10) },
    })
    res.status(204).send()
  } catch (err) {
    if (err.code === 'P2025') {
      return next({
        status: 404,
        message: 'Product not found',
      })
    }
    next(err)
  }
}

export {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
}
