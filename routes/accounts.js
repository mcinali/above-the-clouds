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
} = require('../middleware/validation')

// Create new User Account
router.post('/register', validateAccountSchema, validateUniqueAccountFields, validateRegistrationAccessTokens, async function (req, res) {
  try {
    const results = await registerUser(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to register new user'})
  }
})

// Create new User Account
router.post('/profilePicture', upload.single('file'), async function (req, res) {
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
    return res.status(400).json({error: 'Failed to register new user'})
  }
})

// Get Account Details
router.get('/:accountId', async function (req, res) {
  try {
    const results = await fetchAccountDetails(req.params.accountId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch user details'})
  }
})

module.exports = router
