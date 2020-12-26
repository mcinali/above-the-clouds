const express = require('express')
const router = express.Router()
const { getConnections } = require('../services/connections')

// Get all connections and requests
router.get('/:accountId', async function (req, res) {
  try {
    const results = await getConnections(req.params.accountId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to get connections'})
  }
})

module.exports = router
