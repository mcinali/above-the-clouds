 // using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail')
const { SENDGRID_API_KEY } = require('./secrets')
sgMail.setApiKey(SENDGRID_API_KEY)

// Send email via Sendgrid
function sendEmail(msg){
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent')
    })
    .catch((error) => {
      console.error(error)
    })
}

module.exports ={
  sendEmail,
}
