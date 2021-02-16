const {
  getPasswordFromUsername,
  getAccessTokenFromAccountId,
} = require('../models/auth')
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

module.exports = {
  checkLoginCredentials,
  checkAccountBodyAccessToken,
  checkAccountQueryAccessToken,
  checkAccountParamsAccessToken,
}
