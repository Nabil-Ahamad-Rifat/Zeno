const errorHandler = (err, req, res, next) => {
  // Mongoose: invalid ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' })
  }

  // Mongoose: schema validation failed
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ success: false, error: 'Validation failed', errors })
  }

  // MongoDB: duplicate unique key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field'
    return res.status(409).json({ success: false, error: `${field} already exists` })
  }

  // JWT: malformed token
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }

  // JWT: token expired
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' })
  }

  const status = err.status || 500
  const message = err.message || 'Internal server error'

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${status}] ${req.method} ${req.path} — ${message}`)
    if (status === 500) console.error(err.stack)
  } else if (status === 500) {
    console.error(`[500] ${req.method} ${req.path} — ${message}`)
  }

  const body = { success: false, error: message }
  if (err.errors) body.errors = err.errors

  res.status(status).json(body)
}

export default errorHandler
