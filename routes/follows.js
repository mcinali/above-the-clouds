const express = require('express')
const router = express.Router()
const {
  follow,
  unfollow,
  getFollowingSuggestions,
} = require('../services/follows')
const {
  checkAccountBodyAccessToken,
  checkAccountQueryAccessToken,
} = require('../middleware/auth')

// Get Following Suggestions during Account Setup
router.post('/follow', checkAccountBodyAccessToken, async function (req, res) {
  try {
    const results = await follow(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to follow account'})
  }
})

// Get Following Suggestions during Account Setup
router.post('/unfollow', checkAccountBodyAccessToken, async function (req, res) {
  try {
    const results = await unfollow(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed unfollow account'})
  }
})

// Get Following Suggestions during Account Setup
router.get('/suggestions', checkAccountQueryAccessToken, async function (req, res) {
  try {
    const results = await getFollowingSuggestions(req.query.accountId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch follow suggestions'})
  }
})

module.exports = router