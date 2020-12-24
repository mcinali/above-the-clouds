const express = require('express')
const router = express.Router()
const {
  createStream,
  inviteParticipantToStream,
  joinStream,
  leaveStream,
  endStream,
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

// Send Invites to  Stream
router.post('/invite', async function (req, res) {
  try {
    const results = await inviteParticipantToStream(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: ``})
  }
})

// Join Stream
router.post('/join', async function (req, res) {
  try {
    const results = await joinStream(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: ``})
  }
})

// Leave Stream
router.post('/leave', async function (req, res) {
  try {
    const results = await leaveStream(req.body.streamParticipantId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: ``})
  }
})

// End Stream
router.post('/end', async function (req, res) {
  try {
    const results = await endStream(req.body.streamId)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: ``})
  }
})

module.exports = router
