const express = require('express')
const router = express.Router()
const { validateInvitationCode } = require('../middleware/validation')
const { sendInvitation } = require('../services/invitations')

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

// Validate invitation code
router.get('/check', validateInvitationCode, async function (req, res) {
  try {
    return res.send('OK')
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to send invitation'})
  }
})

module.exports = router
