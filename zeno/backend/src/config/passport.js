import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2'
import User from '../models/User.js'
import { findOrCreateSocialUser } from '../services/authService.js'

const oauthHandler = (provider) => async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateSocialUser(provider, { ...profile, accessToken, refreshToken })
    return done(null, user)
  } catch (err) {
    if (err.message === 'EMAIL_REQUIRED') return done(null, false, { message: 'no_email' })
    return done(err)
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    oauthHandler('google')
  )
)

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'picture'],
    },
    oauthHandler('facebook')
  )
)

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ['r_liteprofile', 'r_emailaddress'],
    },
    oauthHandler('linkedin')
  )
)

passport.serializeUser((user, done) => {
  done(null, user._id ? user._id.toString() : user.id.toString())
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})
