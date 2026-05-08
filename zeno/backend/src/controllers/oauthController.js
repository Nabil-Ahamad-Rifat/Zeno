import { issueJWT } from '../services/authService.js'

const handleOAuthCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      const errorMessage = req.query.message || 'oauth_failed'
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${errorMessage}`
      )
    }

    const token = issueJWT(req.user)

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    res.redirect(`${process.env.FRONTEND_URL}/auth/success`)
  } catch (err) {
    next(err)
  }
}

export const googleCallback = handleOAuthCallback
export const facebookCallback = handleOAuthCallback
export const linkedinCallback = handleOAuthCallback

export const oauthError = (req, res) => {
  const message = req.query.message || 'oauth_failed'
  res.redirect(`${process.env.FRONTEND_URL}/login?error=${message}`)
}
