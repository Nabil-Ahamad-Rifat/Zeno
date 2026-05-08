import {
  hashPassword,
  verifyPassword,
  issueJWT,
  createUser,
  getUserByEmail,
  getUserById,
} from '../services/authService.js'

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    if (!['shopkeeper', 'customer'].includes(role)) {
      return next({
        status: 400,
        message: 'Invalid role. Only "shopkeeper" or "customer" can register.',
      })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return next({
        status: 409,
        message: 'Email already registered',
      })
    }

    const user = await createUser({ name, email, password, role })

    const token = issueJWT(user)

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    const response = {
      success: true,
      user,
    }

    if (role === 'shopkeeper') {
      response.needsShopOnboarding = true
    }

    res.status(201).json(response)
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await getUserByEmail(email)
    if (!user) {
      return next({
        status: 401,
        message: 'Invalid credentials',
      })
    }

    if (!user.passwordHash) {
      return next({
        status: 401,
        message: 'This account uses social login. Use OAuth instead.',
      })
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return next({
        status: 401,
        message: 'Invalid credentials',
      })
    }

    if (user.status !== 'active') {
      return next({
        status: 403,
        message: `Account is ${user.status}`,
      })
    }

    const token = issueJWT(user)

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (err) {
    next(err)
  }
}

export const me = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    const user = await getUserById(req.user.userId)
    if (!user) {
      return next({
        status: 404,
        message: 'User not found',
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (err) {
    next(err)
  }
}
