const express = require('express')
const router = express.Router()
const { getThreads } = require('../services/threads')


// Get threads
router.get('/', async function (req, res) {
  try {
    const results = await getThreads(req.query.userId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch threads for user'})
  }
})

module.exports = router
