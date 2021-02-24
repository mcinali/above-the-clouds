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

async function insertPasswordReset(passwordResetInfo){
  try {
    const { accountId, resetCode, resetToken, verificationCode, resetTTL } = passwordResetInfo
    const query = `
      INSERT INTO password_reset (account_id, reset_code, reset_token, verification_code, expiration, used)
      VALUES (${accountId}, '${resetCode}', '${resetToken}', '${verificationCode}', now() + INTERVAL '${resetTTL} hour', false)
      RETURNING id, account_id, encode(reset_code, 'escape') as reset_code, encode(reset_token, 'escape') as reset_token, encode(verification_code, 'escape') as verification_code, expiration, used`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getPasswordResetInfo(resetCode){
  try {
    const query = `
      SELECT id, account_id, encode(reset_code, 'escape') as reset_code, encode(reset_token, 'escape') as reset_token, encode(verification_code, 'escape') as verification_code, expiration, used
      FROM password_reset WHERE encode(reset_code, 'escape') = '${resetCode}'`
    return pool.query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function updatePassword(passwordUpdateInfo){
  try {
    const { accountId, password } = passwordUpdateInfo
    const query = `
      UPDATE accounts SET password = '${password}' WHERE id = ${accountId}
      RETURNING id as account_id, encode(password, 'escape') as password`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function expirePasswordResetCode(resetCode){
  try {
    const query = `
      UPDATE password_reset SET used = true WHERE encode(reset_code, 'escape') = '${resetCode}'
      RETURNING id, account_id, encode(reset_code, 'escape') as reset_code, used`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertAccessToken,
  getPasswordFromUsername,
  getAccessTokenFromAccountId,
  insertPasswordReset,
  getPasswordResetInfo,
  updatePassword,
  expirePasswordResetCode,
}
