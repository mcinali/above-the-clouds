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

function generateRandomnCode(size, encoding){
  try {
    const code = crypto.randomBytes(size).toString(encoding)
    return code
  } catch (error) {
    throw new Error(error)
  }
}

function generateAccessToken(){
  const date = new Date(new Date().getTime()).getTime().toString()
  const random = Math.random().toString()
  const prefix = generateRandomnCode(24, 'base64')
  const suffix = crypto.createHash('sha256').update(date + random).digest('base64')
  return prefix + '.' + suffix
}

function verifyHashedText(plainText, hashedText){
  try {
    const verified = bcrypt.compareSync(plainText, hashedText)
    return verified
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  hashPlainText,
  generateRandomnCode,
  generateAccessToken,
  verifyHashedText,
}
