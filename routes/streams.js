const express = require('express')
const router = express.Router()
const {
  createStream,
} = require('../services/streams')


// Create Stream
router.post('/', async function (req, res) {
  try {
    const results = await createStream(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: ``})
  }
})

module.exports = router
