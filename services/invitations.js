const {
  insertInvitation,
  checkInvitationCode,
  insertInvitationCodeConversion,
  checkInvitationCodeConversion,
} = require('../models/invitations')
const { getAccountDetails } = require('../models/accounts')
const { sendEmail } = require('../sendgrid')
const { generateRandomnCode } = require('../encryption')

async function sendInvitation(invitationInfo){
  try {
    // Send invitation email
    const { accountId, email } = invitationInfo
    const invitationCode = generateRandomnCode(32, 'hex')
    const accountDetails = await getAccountDetails(accountId)
    const msg = {
      to: email,
      from: 'abovethecloudsapp@gmail.com',
      subject: `You're invited!`,
      text: `
      Your friend ${accountDetails.firstname} ${accountDetails.lastname} invited you to Above the Clouds!

      Click the link below to join:
      http://localhost:3000/register?code=${invitationCode}
      `
    }
    const sentEmail = await sendEmail(msg)
    // Store invitation email
    const invitationInfoInput = {
      accountId: accountId,
      email: email,
      invitationCode: invitationCode,
      invitationCodeTTL: 48,
    }
    const invitation = await insertInvitation(invitationInfoInput)
    return { email: email }
  } catch (error) {
    throw new Error(error)
  }
}

async function storeInvitationCodeConversion(accountId, invitationCode){
  try {
    const invitationCodeIdRow = await checkInvitationCode(invitationCode)
    if (!Boolean(invitationCodeIdRow[0])){
      throw new Error('Invalid invitation code')
    }
    const invitationCodeConversionInfo = {
      accountId: accountId,
      invitationCodeId: invitationCodeIdRow[0].id,
    }
    const invitationCodeConversionRow = await insertInvitationCodeConversion(invitationCodeConversionInfo)
    return invitationCodeConversionRow
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  sendInvitation,
  storeInvitationCodeConversion,
}
