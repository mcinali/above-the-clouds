const {
  insertAccount,
  insertAccountDetails,
  getAccountDetails,
  getAccountInfo,
  getAccountIdFromEmail,
} = require('../models/accounts')
const { getConnectionsEmailOutreachToAccount, insertConnection } = require('../models/connections')
const { getStreamInvitationsFromEmailOutreach, insertStreamInvitation } = require('../models/streams')

async function registerUser(accountInfo){
  try {
    // TO DO: Send registration email
    //  Insert Account
    const account = await insertAccount(accountInfo)
    //  Insert Account Details
    accountInfo['accountId'] = account.id
    const accountDetails = await insertAccountDetails(accountInfo)
    // Convert Connection Email Invites to Account Invites
    const emailConnections = await getConnectionsEmailOutreachToAccount(accountInfo.email)
    const emailToAccountConnections = await Promise.all(emailConnections.map(async (x) => {
                                        console.log(x)
                                        await insertConnection({
                                          accountId:x.accountId,
                                          connectionId:account.id,
                                        })
                                      }))
    // Convert Stream Email Invites to Account Invites
    const streamEmailConnections = await getStreamInvitationsFromEmailOutreach(accountInfo.email)
    const streamEmailToAccountConnections = await Promise.all(streamEmailConnections.map(async (x) => {
                                              console.log(x)
                                              await insertStreamInvitation({
                                                streamId:x.streamId,
                                                accountId:x.accountId,
                                                inviteeAccountId:account.id,
                                              })
                                            }))
    const result = {
      'accountId':account.id,
      'username':account.username,
      'email':accountDetails.email,
      'phone':accountDetails.phone,
      'firstname':accountDetails.firstname,
      'lastname':accountDetails.lastname,
      'createdAt':account.createdAt
    }
    // TO DO: send registration email
    // TO DO: return auth token
    return result
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchAccountDetails(accountId){
  try {
    const account = await getAccountInfo(accountId)
    const accountDetails = await getAccountDetails(accountId)
    const result = {
      'accountId':accountId,
      'username':account.username,
      'email':accountDetails.email,
      'phone':accountDetails.phone,
      'firstname':accountDetails.firstname,
      'lastname':accountDetails.lastname,
      'createdAt':account.createdAt,
    }
    return result
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  registerUser,
  fetchAccountDetails,
}
