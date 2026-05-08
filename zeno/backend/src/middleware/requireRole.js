const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    if (!roles.includes(req.user.role)) {
      return next({
        status: 403,
        message: 'Insufficient permissions',
      })
    }

    next()
  }
}

export default requireRole
