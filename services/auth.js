const {
  insertAccessToken,
  insertPasswordReset,
  getPasswordResetInfo,
  updatePassword,
  expirePasswordResetCode,
} = require('../models/auth')
const {
  getAccountIdFromUsername,
  getAccountIdFromEmail,
  getAccountDetails,
} = require('../models/accounts')
const {
  generateRandomnCode,
  generateAccessToken,
  hashPlainText,
} = require('../encryption')
const { sendEmail } = require('../sendgrid')
const { webURL } = require('../config')
const { sendSMS } = require('../twilio')

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

async function createPasswordReset(body){
  try {
    // Get accountId from email
    const { email } = body
    const accountIdRow = await getAccountIdFromEmail(email)
    if (!Boolean(accountIdRow)){
      throw new Error('Invalid email')
    }
    // Insert password reset info into the DB
    const accountId = accountIdRow.accountId
    const resetCode = generateRandomnCode(32, 'hex')
    const resetToken = generateRandomnCode(32, 'hex')
    const hashedResetToken = hashPlainText(resetToken)
    const verificationCodeInt = Math.floor((Math.random()*1000000)+1)
    const verificationCode = String(verificationCodeInt).padStart(6, '0')
    const passwordResetInfo = {
      accountId: accountId,
      resetCode: resetCode,
      resetToken: hashedResetToken,
      verificationCode: verificationCode,
      resetTTL: 24,
    }
    const passwordReset = await insertPasswordReset(passwordResetInfo)
    // Send Password Reset Email
    const msg = {
      to: email,
      from: 'abovethecloudsapp@gmail.com',
      subject: 'Reset your Above the Clouds password',
      text: `
      Click here to reset your Above the Clouds password:
      ${webURL}/password_reset/verify?code=${resetCode}&token=${resetToken}`
    }
    sendEmail(msg)
    return
  } catch (error) {
    throw new Error(error)
  }
}

async function sendPasswordResetVerificationCode(resetCode){
  try {
    // Get phone number + verification code from password reset code
    const passwordResetInfo = await getPasswordResetInfo(resetCode)
    const accountId = passwordResetInfo.accountId
    const verificationCode = passwordResetInfo.verificationCode
    const accountDetails = await getAccountDetails(accountId)
    const { phone } = accountDetails
    // Send verification code sms
    const phoneNumber = '+1'+phone.toString()
    const message = `Your Above the Clouds password reset verification code is ${verificationCode}`
    sendSMS(phoneNumber, message)
    return
  } catch (error) {
    throw new Error(error)
  }
}

async function updateAccountPassword(body){
  try {
    const { password, resetCode } = body
    const passwordResetInfo = await getPasswordResetInfo(resetCode)
    const accountId = passwordResetInfo.accountId
    const hashedPassword = hashPlainText(password)
    const updatedPasswordInfo = {
      accountId: accountId,
      password: hashedPassword,
    }
    const updatedPassword = await updatePassword(updatedPasswordInfo)
    if (!Boolean(updatedPassword)){
      throw new Error('Invalid password information')
    }
    const expiredPasswordResetCode = await expirePasswordResetCode(resetCode)
    return
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createAccessToken,
  createPasswordReset,
  sendPasswordResetVerificationCode,
  updateAccountPassword,
}
