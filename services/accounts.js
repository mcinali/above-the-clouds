const {
  insertAccount,
  getAccountInfo,
  insertAccountDetails,
  getAccountDetails,
  insertProfilePic,
  getProfilePic,
  getAccountIdFromUsername,
  getAccountIdFromEmail,
  getAccountIdFromPhone,
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
    const emailToAccountConnections = await Promise.all(emailConnections.map(async (emailOutreach) => {
                                        await insertConnection({
                                          accountId:emailOutreach.accountId,
                                          connectionAccountId:account.id,
                                        })
                                      }))
    // Convert Stream Email Invites to Account Invites
    const streamEmailConnections = await getStreamInvitationsFromEmailOutreachForEmail(accountInfo.email)
    const streamEmailToAccountConnections = await Promise.all(streamEmailConnections.map(async (streamEmailOutreach) => {
                                              await insertStreamInvitation({
                                                streamId:streamEmailOutreach.streamId,
                                                accountId:streamEmailOutreach.accountId,
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

async function uploadProfilePic(picInfo){
  try {
    const { accountId, file } = picInfo
    const imageData = new Uint8Array(file.buffer)
    const picDBInput = { accountId: accountId, imageData: imageData }
    const result = await insertProfilePic(picDBInput)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchAccountDetails(accountId){
  try {
    const account = await getAccountInfo(accountId)
    const accountDetails = await getAccountDetails(accountId)
    const profilePic = await getProfilePic(accountId)
    const result = {
      'accountId':accountId,
      'username':account.username,
      'email':accountDetails.email,
      'phone':accountDetails.phone,
      'firstname':accountDetails.firstname,
      'lastnameInitial':accountDetails.lastname.slice(0,1),
      'profilePicture': profilePic.profilePicture,
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
    const profilePic = await getProfilePic(accountId)
    const result = {
      'accountId':accountId,
      'username':account.username,
      'firstname':accountDetails.firstname,
      'lastnameInitial':accountDetails.lastname.slice(0,1),
      'email':accountDetails.email,
      'profilePicture': profilePic.profilePicture,
    }
    return result
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  registerUser,
  uploadProfilePic,
  fetchAccountDetails,
  fetchAccountDetailsBasic,
}
