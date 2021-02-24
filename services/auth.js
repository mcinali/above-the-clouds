const {
  insertAccessToken,
} = require('../models/auth')
const { getAccountIdFromUsername } = require('../models/accounts')
const { generateAccessToken, hashPlainText } = require('../encryption')

async function createAccessToken(username){
  try {
    // Get accountId from username
    const accountIdRow = await getAccountIdFromUsername(username)
    const accountId = accountIdRow.id
    // Create access token & store hashed version in DB
    const accessToken = generateAccessToken()
    const hashedAccessTokenInfo = {
      accountId: accountId,
      accessToken: hashPlainText(accessToken),
      accessTokenTTL: 180,
    }
    const storedAccessToken = await insertAccessToken(hashedAccessTokenInfo)
    // Return plain text access token
    const plainTextAccessTokenInfo = {
      accountId: accountId,
      hasToken: true,
      token: accessToken,
    }
    return plainTextAccessTokenInfo
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createAccessToken,
}
