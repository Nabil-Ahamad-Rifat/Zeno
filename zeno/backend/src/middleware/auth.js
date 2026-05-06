import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return next({
      status: 401,
      message: 'No token provided',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    next({
      status: 401,
      message: 'Invalid token',
    })
  }
}

export default auth
