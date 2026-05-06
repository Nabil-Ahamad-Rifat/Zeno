const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return next({
        status: 400,
        message: 'Validation failed',
        errors: result.error.flatten(),
      })
    }

    req.body = result.data
    next()
  }
}

export default validate
