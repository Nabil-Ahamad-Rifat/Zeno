const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Internal server error'

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${status}] ${message}`, err)
  }

  const response = {
    success: false,
    message,
  }

  if (err.errors) {
    response.errors = err.errors
  }

  res.status(status).json(response)
}

export default errorHandler
