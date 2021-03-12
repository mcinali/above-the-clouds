const {
  twilioConfig: {
    accountSid,
    authToken,
    apiKey,
    apiSecret,
    serviceSid,
  }
} = require('./config')
const twilioClient = require('twilio')(accountSid, authToken)
const AccessToken = require('twilio').jwt.AccessToken
const VideoGrant = AccessToken.VideoGrant

function createTwilioRoomAccessToken(userId, room){
  try {
    const token = new AccessToken(accountSid, apiKey, apiSecret)
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
      .services(serviceSid)
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
