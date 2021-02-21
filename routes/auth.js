const express = require('express')
const router = express.Router()
const {
  checkLoginCredentials,
  checkAccountQueryAccessToken,
} = require('../middleware/auth')
const { createAccessToken } = require('../services/auth')

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

module.exports = router
