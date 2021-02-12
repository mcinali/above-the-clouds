const bcrypt = require('bcrypt')
const crypto = require('crypto')

function hashPlainText(plaintext){
  try {
    const saltRounds = 10
    const salt = bcrypt.genSaltSync(saltRounds)
    const hash = bcrypt.hashSync(plaintext, salt)
    return hash
  } catch (error) {
    throw new Error(error)
  }
}

function generateRandomCode(){
  try {
    const code = crypto.randomBytes(30).toString("hex")
    return code
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  hashPlainText,
  generateRandomCode,
}
