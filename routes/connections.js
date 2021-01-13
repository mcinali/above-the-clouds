const express = require('express')
const router = express.Router()
const {
  getConnections,
  createConnection,
  getConnectionSuggestions,
} = require('../services/connections')

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

// Create new connection
router.post('/new', async function (req, res) {
  try {
    const results = await createConnection(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to create connection'})
  }
})

// Create new connection
router.get('/search/suggestions', async function (req, res) {
  try {
    const results = await getConnectionSuggestions(req.query.text)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to get connection suggestions'})
  }
})

module.exports = router
