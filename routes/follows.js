const express = require('express')
const router = express.Router()
const {
  getFollowingSuggestionsAccountSetup,
} = require('../services/follows')

// Get Following Suggestions during Account Setup
router.get('/following/suggestions/onboarding/:accountId', async function (req, res) {
  try {
    const results = await getFollowingSuggestionsAccountSetup(req.params)
    return res.send(results)
  } catch (error) {
    console.error(error)
    return res.status(400).json({error: 'Failed to fetch follow suggestions'})
  }
})

// // Get Following Suggestions
// router.get('/following/suggestions/:accountId', async function (req, res) {
//   try {
//     // const results = await fetchAccountDetails(req.params.accountId)
//     return res.send(results)
//   } catch (error) {
//     console.error(error)
//     return res.status(400).json({error: 'Failed to fetch follow suggestions'})
//   }
// })

module.exports = router
