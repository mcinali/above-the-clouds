const { TWILIO_ACCOUNT_SID } = require('./secrets')
const { TWILIO_AUTH_TOKEN } = require('./secrets')
const twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

module.exports = {
  twilioClient,
}
