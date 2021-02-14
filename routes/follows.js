const express = require('express')
const router = express.Router()
const {
  follow,
  unfollow,
  getFollowingSuggestions,
} = require('../services/follows')

// Get Following Suggestions during Account Setup
router.post('/follow', async function (req, res) {
  try {
    const results = await follow(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to follow account'})
  }
})

// Get Following Suggestions during Account Setup
router.post('/unfollow', async function (req, res) {
  try {
    const results = await unfollow(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed unfollow account'})
  }
})

// Get Following Suggestions during Account Setup
router.get('/suggestions/:accountId', async function (req, res) {
  try {
    const results = await getFollowingSuggestions(req.params)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch follow suggestions'})
  }
})

module.exports = router
