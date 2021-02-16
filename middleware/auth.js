const {
  getPasswordFromUsername,
  getAccessTokenFromAccountId,
} = require('../models/auth')
const {
  getStreamDetails,
  getStreamParticipants,
  getStreamParticipantDetails,
} = require('../models/streams')
const { verifyHashedText } = require('../encryption')

// Validate login account credentials
async function checkLoginCredentials(req, res, next){
  try {
    const { username, password } = req.body
    if (!Boolean(username) && !Boolean(password)){
      return res.status(401).json({error: ['Invalid login credentials']})
    }
    const hashedPasswordRow = await getPasswordFromUsername(username)
    if (!Boolean(hashedPasswordRow)){
      return res.status(401).json({error: ['Invalid login credentials']})
    }
    const hashedPassword = hashedPasswordRow.password
    const verified = verifyHashedText(password, hashedPassword)
    if (verified){
      next()
    } else {
      return res.status(401).json({error: ['Invalid login credentials']})
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({error: ['Unable to authorize login credentials']})
  }
}

// Validate access token + accountId in request body
async function checkAccountBodyAccessToken(req, res, next){
  try {
    const token = req.header('token')
    const accountId = req.body.accountId
    const verified = await checkAccessToken(accountId, token)
    if (verified){
      next()
    } else {
      return res.status(401).json({error: ['Invalid access token']})
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({error: ['Unable to authorize access token']})
  }
}

// Validate access token + accountId in request query
async function checkAccountQueryAccessToken(req, res, next){
  try {
    const token = req.header('token')
    const accountId = req.query.accountId
    const verified = await checkAccessToken(accountId, token)
    if (verified){
      next()
    } else {
      return res.status(401).json({error: ['Invalid access token']})
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({error: ['Unable to authorize access token']})
  }
}

// Validate access token + accountId in request path
async function checkAccountParamsAccessToken(req, res, next){
  try {
    const token = req.header('token')
    const accountId = req.params.accountId
    const verified = await checkAccessToken(accountId, token)
    if (verified){
      next()
    } else {
      return res.status(401).json({error: ['Invalid access token']})
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({error: ['Unable to authorize access token']})
  }
}

// Helper function to check for validity of access token for accountId
async function checkAccessToken(accountId, accessToken){
  try {
    const accessTokenRows = await getAccessTokenFromAccountId(accountId)
    if (accessTokenRows.length==0){
      return false
    }
    const verifiedTokens = accessTokenRows.map(row => {
      const hashedAccessToken = row.accessToken
      const verified = verifyHashedText(accessToken, hashedAccessToken)
      return verified
    })
    const validTokens = verifiedTokens.filter(item => item)
    if (validTokens.length>0){
      return true
    } else {
      return false
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Check if user has permissions for Stream
async function checkAccountStreamAccess(req, res, next){
  try {
    const streamId = (req.method=='GET') ? req.params.streamId : req.body.streamId
    const accountId = (req.method=='GET') ? req.query.accountId : req.body.accountId
    // Get stream details
    const streamDetails = await getStreamDetails(streamId)
    // Check if stream exists
    if(!Boolean(streamDetails)){
      return res.status(400).json({error: ['Stream does not exist']})
    }
    // Check to make sure user has permission to get stream details
    const streamParticipants = await getStreamParticipants(streamId)
    const streamParticipantsFltrd = streamParticipants.filter(function(streamParticipant){
      if (streamParticipant.accountId==accountId) {return streamParticipant}
    })
    if (streamParticipantsFltrd.length==0 && streamDetails.creatorId!=accountId){
      return res.status(401).json({error: ['User must be active in stream or stream creator']})
    }
    // Make sure stream participant id (if exists) matches accountId & streamId
    const streamParticipantId = (req.body) ? req.body.streamParticipantId : null
    if (streamParticipantId){
      const streamParticipantDetails = await getStreamParticipantDetails(streamParticipantId)
      if (!Boolean(streamParticipantDetails)){
        return res.status(400).json({error: ['Invalid stream participant id']})
      }
      if (streamParticipantDetails.accountId!=accountId){
        return res.status(401).json({error: ['Account id and stream participant id mismatch']})
      }
      if (streamParticipantDetails.streamId!=streamId){
        return res.status(401).json({error: ['Stream id and stream participant id mismatch']})
      }
    }
    next()
  } catch (error) {
    throw new Error(error)
  }
}


module.exports = {
  checkLoginCredentials,
  checkAccountBodyAccessToken,
  checkAccountQueryAccessToken,
  checkAccountParamsAccessToken,
  checkAccountStreamAccess,
}