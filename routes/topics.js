const express = require('express')
const router = express.Router()
const {
  createTopic,
} = require('../services/topics')
const { checkAccountBodyAccessToken } = require('../middleware/auth')


// Create Topic
router.post('/', checkAccountBodyAccessToken, async function (req, res) {
  try {
    const results = await createTopic(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: `Failed to create new topic`})
  }
})

module.exports = router
