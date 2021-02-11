const express = require('express')
const router = express.Router()
const {
  sendInvitation
} = require('../services/invitations')

// Send app inviation to email
router.post('/', async function (req, res) {
  try {
    const results = await sendInvitation(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to send invitation'})
  }
})

module.exports = router
