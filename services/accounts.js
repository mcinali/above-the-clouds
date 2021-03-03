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
const { hashPlainText } = require('../encryption')
const { createAccessToken } = require('../services/auth')
const { storeInvitationCodeConversion } = require('../services/invitations')
const { sendEmail } = require('../sendgrid')

async function registerUser(accountInfo, params){
  try {
    // TO DO: return auth token
    //  Insert Account
    const { username, password } = accountInfo
    const hashedAccountInfo = {
      username: username,
      password: hashPlainText(password),
    }
    const account = await insertAccount(hashedAccountInfo)
    //  Insert Account Details
    accountInfo['accountId'] = account.id
    const accountDetails = await insertAccountDetails(accountInfo)
    // Create access token
    const accessTokenInfo = await createAccessToken(username)
    // Store invitation code conversion
    if (params && params.code){
      const invitationCodeConversion = await storeInvitationCodeConversion(account.id, params.code)
    }
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
      accountId:account.id,
      username:account.username,
      email:accountDetails.email,
      phone:accountDetails.phone,
      firstname:accountDetails.firstname,
      lastname:accountDetails.lastname,
      hasToken: true,
      token: accessTokenInfo.accessToken,
      createdAt:account.createdAt
    }
    return result
  } catch (error) {
    console.error(error)
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
    const profilePicture = (profilePic) ? profilePic.profilePicture : null
    const result = {
      accountId:accountId,
      username:account.username,
      email:accountDetails.email,
      phone:accountDetails.phone,
      firstname:accountDetails.firstname,
      lastname:accountDetails.lastname,
      profilePicture: profilePicture,
      createdAt:account.createdAt,
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
    const profilePicture = (profilePic) ? profilePic.profilePicture : null
    const result = {
      accountId:accountId,
      username:account.username,
      firstname:accountDetails.firstname,
      lastname:accountDetails.lastname,
      profilePicture: profilePicture,
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
