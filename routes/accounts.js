const express = require('express')
const router = express.Router()
const { registerUser } = require('../services/accounts')

// Create new User Account
router.post('/register', async function (req, res) {
  try {
    const results = await registerUser(req.body)
    return res.send('User Registered!')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to register new user'})
  }
})

module.exports = router
