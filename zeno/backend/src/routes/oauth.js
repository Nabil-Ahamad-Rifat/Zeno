import { Router } from 'express'
import passport from 'passport'
import { googleCallback, facebookCallback, linkedinCallback, oauthError } from '../controllers/oauthController.js'

const router = Router()

// Google routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
)

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/v1/oauth/error' }),
  googleCallback
)

// Facebook routes
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['public_profile', 'email'],
  })
)

router.get(
  '/facebook/callback',
  (req, res, next) => {
    passport.authenticate('facebook', (err, user, info) => {
      if (err) {
        return next(err)
      }
      if (!user) {
        const errorMessage = info?.message || 'oauth_failed'
        return res.redirect(`/api/v1/oauth/error?message=${errorMessage}`)
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err)
        }
        facebookCallback(req, res, next)
      })
    })(req, res, next)
  }
)

// LinkedIn routes
router.get(
  '/linkedin',
  passport.authenticate('linkedin', {
    scope: ['r_liteprofile', 'r_emailaddress'],
  })
)

router.get(
  '/linkedin/callback',
  (req, res, next) => {
    passport.authenticate('linkedin', (err, user, info) => {
      if (err) {
        return next(err)
      }
      if (!user) {
        const errorMessage = info?.message || 'oauth_failed'
        return res.redirect(`/api/v1/oauth/error?message=${errorMessage}`)
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err)
        }
        linkedinCallback(req, res, next)
      })
    })(req, res, next)
  }
)

// Error handler
router.get('/error', oauthError)

export default router
