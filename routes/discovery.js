const express = require('express')
const router = express.Router()
const { getDiscoveryStreams } = require('../services/discovery')
const { checkAccountQueryAccessToken } = require('../middleware/auth')

// Get discovery streams for user
router.get('/', checkAccountQueryAccessToken, async function (req, res) {
  try {
    const results = await getDiscoveryStreams(req.query.accountId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch streams'})
  }
})

module.exports = router
