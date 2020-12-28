const express = require('express')
const router = express.Router()
const { getDiscoveryStreams } = require('../services/discovery')

// Get discovery streams for user
router.get('/:accountId', async function (req, res) {
  try {
    const results = await getDiscoveryStreams(req.params.accountId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch streams'})
  }
})

module.exports = router
