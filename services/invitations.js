const {
  insertInvitation,
  getEmailFromInvitationCode,
} = require('../models/invitations')
const { fetchAccountDetailsBasic } = require('./accounts')
const { sendEmail } = require('../sendgrid')
const { generateRandomCode } = require('../encryption')

async function sendInvitation(invitationInfo){
  try {
    // Send invitation email
    const { accountId, email } = invitationInfo
    const invitationCode = generateRandomCode()
    const accountDetails = await fetchAccountDetailsBasic(accountId)
    const msg = {
      to: email,
      from: 'abovethecloudsapp@gmail.com',
      subject: `You're invited!`,
      text: `
      Your friend ${accountDetails.firstname} ${accountDetails.lastname} invited you to Above the Clouds!

      Click the link below to join:
      http://localhost:3000/register?invitationCode=${invitationCode}
      `
    }
    const sentEmail = await sendEmail(msg)
    console.log(sentEmail)
    // Store invitation email
    const invitationInfoInput = {
      accountId: accountId,
      email: email,
      invitationCode: invitationCode,
    }
    const invitation = await insertInvitation(invitationInfoInput)
    return { email: email }
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  sendInvitation,
}
