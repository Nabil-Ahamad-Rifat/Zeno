import {
  getAdminStats,
  getUsers,
  banUser,
  unbanUser,
  updateUserRole,
  getShops,
  suspendShop,
} from '../services/adminService.js'

export const stats = async (req, res, next) => {
  try {
    const statsData = await getAdminStats()
    res.status(200).json({
      success: true,
      data: statsData,
    })
  } catch (err) {
    next(err)
  }
}

export const listUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1 } = req.query
    const pageNum = parseInt(page, 10)

    const filters = {}
    if (role) filters.role = role
    if (status) filters.status = status
    if (search) filters.search = search

    const usersData = await getUsers(filters, pageNum)

    res.status(200).json({
      success: true,
      data: usersData,
    })
  } catch (err) {
    next(err)
  }
}

export const handleBanUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await banUser(id)

    res.status(200).json({
      success: true,
      message: 'User banned',
      user,
    })
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return next({
        status: 404,
        message: 'User not found',
      })
    }
    next(err)
  }
}

export const handleUnbanUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await unbanUser(id)

    res.status(200).json({
      success: true,
      message: 'User unbanned',
      user,
    })
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return next({
        status: 404,
        message: 'User not found',
      })
    }
    next(err)
  }
}

export const handleUpdateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const { role } = req.body

    const user = await updateUserRole(id, role)

    res.status(200).json({
      success: true,
      message: 'User role updated',
      user,
    })
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return next({
        status: 404,
        message: 'User not found',
      })
    }
    if (err.message === 'INVALID_ROLE') {
      return next({
        status: 400,
        message: 'Invalid role',
      })
    }
    next(err)
  }
}

export const listShops = async (req, res, next) => {
  try {
    const { page = 1 } = req.query
    const pageNum = parseInt(page, 10)

    const shopsData = await getShops(pageNum)

    res.status(200).json({
      success: true,
      data: shopsData,
    })
  } catch (err) {
    next(err)
  }
}

export const handleSuspendShop = async (req, res, next) => {
  try {
    const { id } = req.params

    await suspendShop(id)

    res.status(200).json({
      success: true,
      message: 'Shop suspended and all staff banned',
    })
  } catch (err) {
    if (err.message === 'SHOP_NOT_FOUND') {
      return next({
        status: 404,
        message: 'Shop not found',
      })
    }
    next(err)
  }
}
