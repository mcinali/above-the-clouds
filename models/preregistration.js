const { pool, pgTransaction, freeTextFormatter } = require('../pg_helpers')

async function insertEmailAccessCodes(emailAccessCodeInfo){
  try {
    const { email, accessCode, accessToken, ttl } = emailAccessCodeInfo
    const query = `
      INSERT INTO registration_email_access_codes (email, access_code, access_token, expired_at)
      VALUES ('${email}', ${accessCode}, '${accessToken}', now() + INTERVAL '${ttl} minute')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchEmailAccessTokenFromAccessCode(emailAccessCodeInfo){
  try {
    const { email, accessCode } = emailAccessCodeInfo
    const query = `
      SELECT encode(access_token, 'escape') as access_token, expired_at < now() as expired
      FROM registration_email_access_codes
      WHERE email = '${email}' AND access_code = ${accessCode}`
    const result = await pgTransaction(query)
    return result.rows
  } catch (error) {
    throw new Error(error)
  }
}

async function verifyEmailAccessToken(emailAccessCodeInfo){
  try {
    const { email, accessToken } = emailAccessCodeInfo
    const query = `
      SELECT expired_at < now() as expired
      FROM registration_email_access_codes
      WHERE email = '${email}' AND encode(access_token, 'escape') = '${accessToken}'`
    const result = await pgTransaction(query)
    return result.rows
  } catch (error) {
    throw new Error(error)
  }
}

async function insertPhoneAccessCodes(phoneAccessCodeInfo){
  try {
    const { phone, accessCode, accessToken, ttl } = phoneAccessCodeInfo
    const query = `
      INSERT INTO registration_phone_access_codes (phone, access_code, access_token, expired_at)
      VALUES (${phone}, ${accessCode}, '${accessToken}', now() + INTERVAL '${ttl} minute')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchPhoneAccessTokenFromAccessCode(phoneAccessCodeInfo){
  try {
    const { phone, accessCode } = phoneAccessCodeInfo
    const query = `
      SELECT encode(access_token, 'escape') as access_token, expired_at < now() as expired
      FROM registration_phone_access_codes
      WHERE phone = ${phone} AND access_code = ${accessCode}`
    const result = await pgTransaction(query)
    return result.rows
  } catch (error) {
    throw new Error(error)
  }
}

async function verifyPhoneAccessToken(phoneAccessCodeInfo){
  try {
    const { phone, accessToken } = phoneAccessCodeInfo
    const query = `
      SELECT expired_at < now() as expired
      FROM registration_phone_access_codes
      WHERE phone = ${phone} AND encode(access_token, 'escape') = '${accessToken}'`
    const result = await pgTransaction(query)
    return result.rows
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertEmailAccessCodes,
  fetchEmailAccessTokenFromAccessCode,
  verifyEmailAccessToken,
  insertPhoneAccessCodes,
  fetchPhoneAccessTokenFromAccessCode,
  verifyPhoneAccessToken,
}
