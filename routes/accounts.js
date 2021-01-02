const express = require('express')
const router = express.Router()
const { registerUser, fetchAccountDetails, validateAccountFields } = require('../services/accounts')

// Create new User Account
router.post('/register', async function (req, res) {
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

// Validate Account Fields
router.post('/validate', async function (req, res) {
  try {
    const results = await validateAccountFields(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to validate account fields'})
  }
})

module.exports = router
