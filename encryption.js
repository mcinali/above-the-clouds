const bcrypt = require('bcrypt')

function hashPlainText(plaintext){
  const saltRounds = 10
  const salt = bcrypt.genSaltSync(saltRounds)
  const hash = bcrypt.hashSync(plaintext, salt)
  return hash
}

module.exports = {
  hashPlainText,
}
