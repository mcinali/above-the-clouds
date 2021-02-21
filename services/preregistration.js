const {
  insertEmailAccessCodes,
  fetchEmailAccessTokenFromAccessCode,
  verifyEmailAccessToken,
  insertPhoneAccessCodes,
  fetchPhoneAccessTokenFromAccessCode,
  verifyPhoneAccessToken,
} = require('../models/preregistration')
const { generateRandomnCode } = require('../encryption')
const { sendEmail } = require('../sendgrid')
const { sendSMS } = require('../twilio')


async function createEmailAccessCodes(accountInfo){
  try {
    const { email } = accountInfo
    const accessCodeInt = Math.floor((Math.random()*1000000)+1)
    const accessCode = String(accessCodeInt).padStart(6, '0')
    const accessToken = generateRandomnCode(32, 'base64')
    const emailAccessCodesInfo = {
      email: email,
      accessCode: accessCode,
      accessCodeTTL: 5,
      accessToken: accessToken,
      accessTokenTTL: 5,
    }
    const emailAccessCodes = await insertEmailAccessCodes(emailAccessCodesInfo)
    // Send Registration Email
    const msg = {
      to: email,
      from: 'abovethecloudsapp@gmail.com',
      subject: 'Your Above the Clouds Access Code',
      text: `Your access code is: ${accessCode}`
    }
    sendEmail(msg)
    return
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
}

async function verifyEmailAccessCode(emailAccessCodeInfo){
  try {
    const accessTokenRow = await fetchEmailAccessTokenFromAccessCode(emailAccessCodeInfo)
    if (accessTokenRow.length==0){
      throw new Error('Invalid access code')
    } else if (accessTokenRow[0].expired) {
      throw new Error('Expired access code')
    }
    const accessToken = accessTokenRow[0].accessToken
    const result = {
      hasToken: true,
      accessToken: accessToken,
    }
    return result
  } catch (error) {
    throw new Error(error)
  }
}

async function createPhoneAccessCodes(accountInfo){
  try {
    const { phone } = accountInfo
    const accessCodeInt = Math.floor((Math.random()*1000000)+1)
    const accessCode = String(accessCodeInt).padStart(6, '0')
    const accessToken = generateRandomnCode(32, 'base64')
    const phoneAccessCodesInfo = {
      phone: phone,
      accessCode: accessCode,
      accessCodeTTL: 5,
      accessToken: accessToken,
      accessTokenTTL: 5,
    }
    const phoneAccessCodes = await insertPhoneAccessCodes(phoneAccessCodesInfo)
    // Send Registration Email
    const phoneNumber = '+1'+phone.toString()
    const message = `Your Above the Clouds access code is ${accessCode}`
    sendSMS(phoneNumber, message)
    return
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
}

async function verifyPhoneAccessCode(phoneAccessCodeInfo){
  try {
    const accessTokenRow = await fetchPhoneAccessTokenFromAccessCode(phoneAccessCodeInfo)
    if (accessTokenRow.length==0){
      throw new Error('Invalid access code')
    } else if (accessTokenRow[0].expired) {
      throw new Error('Expired access code')
    }
    const accessToken = accessTokenRow[0].accessToken
    const result = {
      hasToken: true,
      accessToken: accessToken,
    }
    return result
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createEmailAccessCodes,
  verifyEmailAccessCode,
  createPhoneAccessCodes,
  verifyPhoneAccessCode,
}
