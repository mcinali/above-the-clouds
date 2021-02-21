const express = require('express')
const router = express.Router()
const {
  createStream,
  getStreamInfo,
  inviteParticipantToStream,
  joinStream,
  leaveStream,
  endStream,
} = require('../services/streams')
const {
  checkAccountBodyAccessToken,
  checkAccountQueryAccessToken,
  checkAccountStreamAccess,
} = require('../middleware/auth')


// Create Stream
router.post('/', checkAccountBodyAccessToken, async function (req, res) {
  try {
    const results = await createStream(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: `Failed to created new stream`})
  }
})

// Get Stream Details
router.get('/:streamId', checkAccountQueryAccessToken, checkAccountStreamAccess, async function (req, res) {
  try {
    const input = {
      'streamId':req.params.streamId,
      'accountId':req.query.accountId,
    }
    const results = await getStreamInfo(input)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: `Failed to fetch stream details`})
  }
})

// Send Invites to  Stream
router.post('/invite', checkAccountBodyAccessToken, checkAccountStreamAccess, async function (req, res) {
  try {
    const results = await inviteParticipantToStream(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: `Failed to send stream invite`})
  }
})

// Join Stream
router.post('/join', checkAccountBodyAccessToken, async function (req, res) {
  try {
    const results = await joinStream(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: `Failed to join stream`})
  }
})

// Leave Stream
router.post('/leave', checkAccountBodyAccessToken, checkAccountStreamAccess, async function (req, res) {
  try {
    const results = await leaveStream(req.body.streamParticipantId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: `Failed to leave stream`})
  }
})

// End Stream
router.post('/end', checkAccountBodyAccessToken, checkAccountStreamAccess, async function (req, res) {
  try {
    const results = await endStream(req.body.streamId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: `Failed to end stream`})
  }
})

module.exports = router
