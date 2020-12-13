const { insertAccount, insertAccountDetails } = require('../models/accounts')

async function registerUser(accountInfo){
  try {
    const account = await insertAccount(accountInfo)
    accountInfo['accountId'] = account.id
    const accountDetails = insertAccountDetails(accountInfo)
    // TO DO: return auth token
    return accountInfo
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  registerUser,
}
