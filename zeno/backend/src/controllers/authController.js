import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    const adminUsername = process.env.ADMIN_USERNAME
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

    if (!adminUsername || !adminPasswordHash) {
      return next({
        status: 500,
        message: 'Admin credentials not configured',
      })
    }

    if (username !== adminUsername) {
      return next({
        status: 401,
        message: 'Invalid credentials',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash)

    if (!isPasswordValid) {
      return next({
        status: 401,
        message: 'Invalid credentials',
      })
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    })

    res.status(200).json({
      success: true,
      token,
    })
  } catch (err) {
    next(err)
  }
}

export { login }
