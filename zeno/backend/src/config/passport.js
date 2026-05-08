import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'
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

// LinkedIn OpenID Connect — passport-linkedin-oauth2 uses the old /v2/me API
// which is incompatible with the new OIDC product. Use OAuth2Strategy with
// custom userProfile() that calls /v2/userinfo instead.
const linkedInStrategy = new OAuth2Strategy(
  {
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    state: true,
  },
  oauthHandler('linkedin')
)

linkedInStrategy.userProfile = async (accessToken, done) => {
  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    const profile = {
      id: data.sub,
      displayName: data.name,
      name: { givenName: data.given_name || '', familyName: data.family_name || '' },
      emails: data.email ? [{ value: data.email }] : [],
      photos: data.picture ? [{ value: data.picture }] : [],
    }
    done(null, profile)
  } catch (err) {
    done(err)
  }
}

passport.use('linkedin', linkedInStrategy)

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
