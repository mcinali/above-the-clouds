const express = require('express')
const router = express.Router()
const {
  checkLoginCredentials,
  checkAccountQueryAccessToken,
  validatePasswordResetToken,
  validatePasswordResetTokenAndVerificationCode,
} = require('../middleware/auth')
const {
  createAccessToken,
  createPasswordReset,
  sendPasswordResetVerificationCode,
  updateAccountPassword,
} = require('../services/auth')

// Login account
router.post('/login', checkLoginCredentials, async function (req, res) {
  try {
    const results = await createAccessToken(req.body.username)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to log in'})
  }
})

// Authenticate user
router.get('/validate', checkAccountQueryAccessToken, async function (req, res) {
  try {
    return res.send('OK')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to authenticate user'})
  }
})

// Send password reset email
router.post('/password_reset/email', async function (req, res) {
  try {
    const passwordReset = await createPasswordReset(req.body)
    return res.send('Reset password email sent')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to authenticate user'})
  }
})

// Check if password reset token is valid
router.get('/password_reset/validate_reset_code', validatePasswordResetToken, async function (req, res) {
  try {
    return res.send('OK')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to authenticate user'})
  }
})

// Send sms verificatin code
router.get('/password_reset/phone_code', validatePasswordResetToken, async function (req, res) {
  try {
    const phoneCode = await sendPasswordResetVerificationCode(req.query.code)
    return res.send('SMS verification code sent')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to authenticate user'})
  }
})

// Update password
router.post('/password_reset/update', validatePasswordResetTokenAndVerificationCode, async function (req, res) {
  try {
    const updatedPassword = await updateAccountPassword(req.body)
    return res.send('Password reset successfully')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to authenticate user'})
  }
})

module.exports = router
