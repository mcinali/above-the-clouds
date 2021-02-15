const express = require('express')
const router = express.Router()
const { getAccountSuggestions } = require('../services/suggestions')

// Get discovery streams for user
router.get('/', async function (req, res) {
  try {
    const results = await getAccountSuggestions(req.query.accountId, req.query.text)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to get account suggestions'})
  }
})

module.exports = router
