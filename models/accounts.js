const { pool, pgTransaction } = require('../pg_helpers')

async function insertAccount(accountInfo){
  try {
    const { username, password } = accountInfo
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

async function insertAccountDetails(accountDetails){
  try {
    const { accountId, email, phone, firstname, lastname } = accountDetails
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

async function getAccountDetails(accountId){
  try {
    const query = `
      SELECT account_id, email, phone, firstname, lastname
      FROM account_details where account_id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getUsernameFromAccountId(accountId){
  try {
    const query = `
      SELECT username FROM accounts where id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountIdFromEmail(email){
  try {
    const query = `SELECT account_id FROM account_details where email = '${email}'`
    console.log(query)
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertAccount,
  insertAccountDetails,
  getAccountDetails,
  getUsernameFromAccountId,
  getAccountIdFromEmail,
}
