const express = require('express')
const router = express.Router()
const {
  onlineBroadcast,
} = require('../services/broadcasts')
const {
  checkAccountBodyAccessToken,
  checkAccountQueryAccessToken,
} = require('../middleware/auth')

// Online broadcast to followers
router.post('/online', checkAccountBodyAccessToken, async function (req, res) {
  try {
    const results = await onlineBroadcast(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to broadcast online status'})
  }
})

module.exports = router
