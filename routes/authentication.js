const express = require('express')
const router = express.Router()
const { validateAccessToken } = require('../middleware/auth')

// Authenticate user
router.post('/', validateAccessToken, async function (req, res) {
  try {
    return res.send('OK')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to authenticate user'})
  }
})

module.exports = router
