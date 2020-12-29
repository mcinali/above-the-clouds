const {
  insertAccount,
  insertAccountDetails,
  getAccountDetails,
  getAccountInfo,
  getAccountIdFromEmail,
} = require('../models/accounts')
const { getConnectionsEmailOutreachToAccount, insertConnection } = require('../models/connections')
const { getStreamInvitationsFromEmailOutreachForEmail, insertStreamInvitation } = require('../models/streams')
const { sendEmail } = require('../sendgrid')

async function registerUser(accountInfo){
  try {
    // TO DO: return auth token
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
    const streamEmailConnections = await getStreamInvitationsFromEmailOutreachForEmail(accountInfo.email)
    console.log('Stream Email Connections: ', streamEmailConnections)
    const streamEmailToAccountConnections = await Promise.all(streamEmailConnections.map(async (x) => {
                                              console.log(x)
                                              await insertStreamInvitation({
                                                streamId:x.streamId,
                                                accountId:x.accountId,
                                                inviteeAccountId:account.id,
                                              })
                                            }))
    // Send Registration Email
    const msg = {
      to: accountDetails.email,
      from: 'abovethecloudsapp@gmail.com',
      subject: 'Welcome to Above the Clouds!',
      text: 'Welcome to Above the Clouds! You now have access to meaningful conversations.'
    }
    sendEmail(msg)
    // Return result
    const result = {
      'accountId':account.id,
      'username':account.username,
      'email':accountDetails.email,
      'phone':accountDetails.phone,
      'firstname':accountDetails.firstname,
      'lastname':accountDetails.lastname,
      'createdAt':account.createdAt
    }
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
      'lastnameInitial':accountDetails.lastname.slice(0,1),
      'createdAt':account.createdAt,
    }
    return result
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchAccountDetailsBasic(accountId){
  try {
    const account = await getAccountInfo(accountId)
    const accountDetails = await getAccountDetails(accountId)
    const result = {
      'accountId':accountId,
      'username':account.username,
      'firstname':accountDetails.firstname,
      'lastnameInitial':accountDetails.lastname.slice(0,1),
      'email':accountDetails.email,
    }
    return result
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  registerUser,
  fetchAccountDetails,
  fetchAccountDetailsBasic,
}
