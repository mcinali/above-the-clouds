const express = require('express')
const router = express.Router()
const { registerUser, fetchAccountDetails } = require('../services/accounts')
const { validateAccountSchema, validateUniqueAccountFields } = require('../middleware/apiValidation')

// Create new User Account
router.post('/register', validateAccountSchema, validateUniqueAccountFields, async function (req, res) {
  try {
    const results = await registerUser(req.body)
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
