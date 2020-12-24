const express = require('express')
const router = express.Router()
const {
  createTopic,
} = require('../services/topics')


// Create Topic
router.post('/', async function (req, res) {
  try {
    const results = await createTopic(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: ``})
  }
})

module.exports = router
