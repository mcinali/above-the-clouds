const { pgTransaction } = require('../pg_helpers')

async function insertAccount(account_info){
  try {
    const { username, password } = account_info
    const query = `
      INSERT INTO accounts (username, password)
      VALUES ('${username}', '${password}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function insertAccountDetails(account_details){
  try {
    const { accountId, email, phone, firstname, lastname } = account_details
    const query = `
      INSERT INTO account_details (account_id, email, phone, firstname, lastname)
      VALUES (${accountId}, '${email}', ${phone}, '${firstname}', '${lastname}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertAccount,
  insertAccountDetails,
}
