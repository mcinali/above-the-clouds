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

async function getAccountInfo(accountId){
  try {
    const query = `
      SELECT * FROM accounts where id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
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

async function insertProfilePic(picInfo){
  try {
    const { accountId, imageData } = picInfo
    const query = `
      INSERT INTO account_profile_pictures ( account_id, profile_picture )
      VALUES (${accountId}, '${imageData}')
      RETURNING id, account_id, encode(profile_picture, 'escape') as profile_picture`
    const results = await pgTransaction(query)
    return results.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getProfilePic(accountId){
  try {
    const query = `SELECT encode(profile_picture, 'escape') as profile_picture FROM account_profile_pictures WHERE account_id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountIdFromUsername(username){
  try {
    const query = `SELECT id FROM accounts where lower(username) = lower('${username}')`
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
    const query = `SELECT account_id FROM account_details where lower(email) = lower('${email}')`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountIdFromPhone(phone){
  try {
    const query = `SELECT account_id FROM account_details where cast(phone as varchar) = '${phone}'`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function fuzzyMatchAccountsByUsername(text){
  try {
    const query = `SELECT id as account_id FROM accounts WHERE lower(username) LIKE lower('${text}%')`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function fuzzyMatchAccountsByEmail(text){
  try {
    const query = `SELECT account_id FROM account_details WHERE lower(email) LIKE lower('${text}%')`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function fuzzyMatchAccountsByFullName(firstname, lastname){
  try {
    const query = `SELECT account_id FROM account_details WHERE lower(firstname) LIKE lower('${firstname}%') AND lower(lastname) LIKE lower('${lastname}%')`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertAccount,
  getAccountInfo,
  insertAccountDetails,
  getAccountDetails,
  insertProfilePic,
  getProfilePic,
  getAccountIdFromUsername,
  getAccountIdFromEmail,
  getAccountIdFromPhone,
  fuzzyMatchAccountsByUsername,
  fuzzyMatchAccountsByEmail,
  fuzzyMatchAccountsByFullName,
}
