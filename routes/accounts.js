const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer()
const {
  registerUser,
  uploadProfilePic,
  fetchAccountDetails,
} = require('../services/accounts')
const {
  validateAccountSchema,
  validateUniqueAccountFields,
  validateRegistrationAccessTokens,
  validateInvitationCode,
} = require('../middleware/validation')
const {
  checkAccountBodyAccessToken,
  checkAccountParamsAccessToken,
} = require('../middleware/auth')

// Create new User Account
router.post('/register', validateAccountSchema, validateUniqueAccountFields, validateRegistrationAccessTokens, validateInvitationCode, async function (req, res) {
  try {
    const results = await registerUser(req.body, req.query)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to register new user'})
  }
})

// Create new User Account
router.post('/profilePicture', upload.single('file'), checkAccountBodyAccessToken, async function (req, res) {
  try {
    const input = {
      accountId: req.body.accountId,
      file: req.file,
    }
    const results = await uploadProfilePic(input)
    results['file'] = req.file
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to upload profile pic'})
  }
})

// Get Account Details
router.get('/:accountId', checkAccountParamsAccessToken, async function (req, res) {
  try {
    const results = await fetchAccountDetails(req.params.accountId)
    console.log(results)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch user details'})
  }
})

module.exports = router
