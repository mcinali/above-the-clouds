const {
  SENDGRID_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_SERVICE_SID,
} = require('./secrets')
const twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
const AccessToken = require('twilio').jwt.AccessToken
const VideoGrant = AccessToken.VideoGrant

function createTwilioRoomAccessToken(userId, room){
  try {
    const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET)
    token.identity = userId
    const videoGrant = new VideoGrant({
      room: room,
    })
    token.addGrant(videoGrant)
    return token.toJwt()
  } catch (error) {
    throw new Error(error)
  }
}

function sendSMS(phoneNumber, message){
  try {
    const notification = {
      toBinding: JSON.stringify({
        binding_type: 'sms',
        address: phoneNumber,
      }),
      body: message,
    }
    twilioClient.notify
      .services(TWILIO_SERVICE_SID)
      .notifications.create(notification)
      .then(notification => console.log('SMS sent'))
      .catch(error => console.error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  twilioClient,
  createTwilioRoomAccessToken,
  sendSMS,
}
