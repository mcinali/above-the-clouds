const express = require('express')
const router = express.Router()

// Hellow world
router.get('/', async function (req, res) {
  try {
    return res.send('Hello World!')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to say hello :('})
  }
})

module.exports = router
