import { sendInvitationEmail } from '../services/emailService.js'
import {
  createInvitation,
  getInvitation,
  acceptInvitation,
  getShopStaff,
  removeSeller,
} from '../services/invitationService.js'
import { issueJWT } from '../services/authService.js'

export const inviteSeller = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    if (!req.user.shopId) {
      return next({
        status: 403,
        message: 'SHOP_REQUIRED',
      })
    }

    const { email } = req.body

    const invitation = await createInvitation(req.user.shopId, email)

    // Send invitation email in background
    if (process.env.GMAIL_USER) {
      sendInvitationEmail(invitation, req.user.shopId).catch((err) => {
        console.error('Background email send failed:', err.message)
      })
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const getInvitationInfo = async (req, res, next) => {
  try {
    const { token } = req.params

    const invitation = await getInvitation(token)

    res.status(200).json({
      success: true,
      invitation: {
        email: invitation.email,
        shopName: invitation.shopId?.name,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (err) {
    if (err.message === 'INVITATION_NOT_FOUND') {
      return next({
        status: 404,
        message: 'Invitation not found',
      })
    }
    if (err.message === 'INVITATION_ALREADY_USED') {
      return next({
        status: 400,
        message: 'This invitation has already been used',
      })
    }
    if (err.message === 'INVITATION_EXPIRED') {
      return next({
        status: 400,
        message: 'This invitation has expired',
      })
    }
    next(err)
  }
}

export const acceptInvitationHandler = async (req, res, next) => {
  try {
    const { token } = req.params
    const { name, password } = req.body

    const user = await acceptInvitation(token, name, password)

    const jwtToken = issueJWT(user)

    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    res.status(201).json({
      success: true,
      user,
    })
  } catch (err) {
    if (err.message === 'INVITATION_NOT_FOUND') {
      return next({
        status: 404,
        message: 'Invitation not found',
      })
    }
    if (err.message === 'INVITATION_ALREADY_USED') {
      return next({
        status: 400,
        message: 'This invitation has already been used',
      })
    }
    if (err.message === 'INVITATION_EXPIRED') {
      return next({
        status: 400,
        message: 'This invitation has expired',
      })
    }
    if (err.message === 'USER_ALREADY_EXISTS') {
      return next({
        status: 409,
        message: 'A user with this email already exists',
      })
    }
    next(err)
  }
}

export const listStaff = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    if (!req.user.shopId) {
      return next({
        status: 403,
        message: 'SHOP_REQUIRED',
      })
    }

    const staff = await getShopStaff(req.user.shopId)

    res.status(200).json({
      success: true,
      data: staff,
    })
  } catch (err) {
    next(err)
  }
}

export const removeStaff = async (req, res, next) => {
  try {
    if (!req.user) {
      return next({
        status: 401,
        message: 'Not authenticated',
      })
    }

    if (!req.user.shopId) {
      return next({
        status: 403,
        message: 'SHOP_REQUIRED',
      })
    }

    const { id } = req.params

    await removeSeller(req.user.shopId, id)

    res.status(200).json({
      success: true,
      message: 'Staff member removed',
    })
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return next({
        status: 404,
        message: 'User not found',
      })
    }
    if (err.message === 'USER_NOT_IN_SHOP') {
      return next({
        status: 403,
        message: 'User is not in your shop',
      })
    }
    next(err)
  }
}
