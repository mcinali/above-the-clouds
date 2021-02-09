const express = require('express')
const router = express.Router()
const {
  validatePreRegistrationAccountSchema,
  validatePhoneNumberSchema,
  validateAccessCodeSchema,
  validateUniquePreRegistrationAccountFields,
  validateUniquePhoneNumber,
} = require('../middleware/validation')
const {
  createEmailAccessCodes,
  verifyEmailAccessCode,
  createPhoneAccessCodes,
  verifyPhoneAccessCode,
} = require('../services/preregistration')

// Check User Account form info
router.post('/accountDetails/check', validatePreRegistrationAccountSchema, validateUniquePreRegistrationAccountFields, async function (req, res) {
  try {
    await createEmailAccessCodes(req.body)
    return res.send('OK')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to email access code'})
  }
})

// Verify email access code
router.post('/verify/email', validateAccessCodeSchema, async function (req, res) {
  try {
    const result = await verifyEmailAccessCode(req.body)
    return res.send(result)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Invalid or expired access code'})
  }
})

// Send user access code text message
router.post('/phone/code', validatePhoneNumberSchema, validateUniquePhoneNumber, async function (req, res) {
  try {
    await createPhoneAccessCodes(req.body)
    return res.send('OK')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to register new user'})
  }
})

// Verify phone access code
router.post('/verify/phone', validateAccessCodeSchema, async function (req, res) {
  try {
    const result = await verifyPhoneAccessCode(req.body)
    return res.send(result)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Invalid or expired access code'})
  }
})

module.exports = router
