const {
  insertAccessToken,
} = require('../models/auth')
const { generateAccessToken, hashPlainText } = require('../encryption')

async function createAccessToken(accountId){
  try {
    const accessToken = generateAccessToken()
    const hashedAccessTokenInfo = {
      accountId: accountId,
      accessToken: hashPlainText(accessToken),
      accessTokenTTL: 180,
    }
    const storedAccessToken = await insertAccessToken(hashedAccessTokenInfo)
    const plainTextAccessTokenInfo = {
      hastoken: true,
      accessToken: accessToken,
    }
    return plainTextAccessTokenInfo
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createAccessToken,
}
