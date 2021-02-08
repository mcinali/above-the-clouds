const { pool, pgTransaction, freeTextFormatter } = require('../pg_helpers')

async function insertEmailAccessCodes(emailAccessCodeInfo){
  try {
    const { email, accessCode, accessCodeTTL, accessToken, accessTokenTTL } = emailAccessCodeInfo
    const query = `
      INSERT INTO registration_email_access_codes (email, access_code, access_code_expiration, access_token, access_token_expiration)
      VALUES ('${email}', '${accessCode}', now() + INTERVAL '${accessCodeTTL} minute', '${accessToken}', now() + INTERVAL '${accessTokenTTL} minute')
      RETURNING email, access_code, encode(access_token, 'escape') as access_token`
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
      SELECT encode(access_token, 'escape') as access_token, access_code_expiration < now() as expired
      FROM registration_email_access_codes
      WHERE email = '${email}' AND access_code = '${accessCode}'`
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
      SELECT access_token_expiration < now() as expired
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
    const { phone, accessCode, accessCodeTTL, accessToken, accessTokenTTL } = phoneAccessCodeInfo
    const query = `
      INSERT INTO registration_phone_access_codes (phone, access_code, access_code_expiration, access_token, access_token_expiration)
      VALUES (${phone}, '${accessCode}', now() + INTERVAL '${accessCodeTTL} minute', '${accessToken}', now() + INTERVAL '${accessTokenTTL} minute')
      RETURNING phone, access_code, encode(access_token, 'escape') as access_token`
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
      SELECT encode(access_token, 'escape') as access_token, access_code_expiration < now() as expired
      FROM registration_phone_access_codes
      WHERE phone = ${phone} AND access_code = '${accessCode}'`
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
      SELECT access_token_expiration < now() as expired
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
