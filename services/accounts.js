const { insertAccount, insertAccountDetails, getAccountDetails } = require('../models/accounts')

async function registerUser(accountInfo){
  try {
    const account = await insertAccount(accountInfo)
    accountInfo['accountId'] = account.id
    const accountDetails = insertAccountDetails(accountInfo)
    // TO DO: send registration email
    // TO DO: return auth token
    return accountInfo
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchAccountDetails(accountId){
  try {
    const accountDetails = getAccountDetails(accountId)
    return accountDetails
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  registerUser,
  fetchAccountDetails,
}
