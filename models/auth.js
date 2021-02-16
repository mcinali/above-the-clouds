const { pool, pgTransaction } = require('../pg_helpers')

async function insertAccessToken(tokenInfo){
  try {
    const { accountId, accessToken, accessTokenTTL } = tokenInfo
    const query = `
      INSERT INTO access_tokens (account_id, access_token, access_token_expiration)
      VALUES (${accountId}, '${accessToken}', now() + INTERVAL '${accessTokenTTL} day')
      RETURNING account_id, encode(access_token, 'escape') as access_token, access_token_expiration`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getPasswordFromUsername(username){
  try {
    const query = `SELECT encode(password, 'escape') as password FROM accounts WHERE username = '${username}'`
    return pool.query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccessTokenFromAccountId(accountId){
  try {
    const query = `
      SELECT encode(access_token, 'escape') as access_token
      FROM access_tokens
      WHERE account_id = ${accountId} AND access_token_expiration >= now()`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertAccessToken,
  getPasswordFromUsername,
  getAccessTokenFromAccountId,
}
