const express = require('express')
const router = express.Router()
const {
  createNewTopicThread,
  forkTopicThread,
  sendEmailInviteToThread,
} = require('../services/threads')

// Post thread
router.post('/', async function (req, res) {
  try {
    const results = await createThreadWithNewTopic(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to create new thread'})
  }
})

// Post fork thread
router.post('/fork', async function (req, res) {
  try {
    const results = await createThreadForkTopic(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fork thread'})
  }
})

// Post send invite via email
router.post('/invite', async function (req, res) {
  try {
    const results = await sendEmailInviteToThread(req.body)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to send invitation'})
  }
})

module.exports = router
