const { pool, pgTransaction } = require('../pg_helpers')

async function insertInvitation(invitationInfo){
  try {
    const { accountId, email, invitationCode, invitationCodeTTL } = invitationInfo
    const query = `
      INSERT INTO app_invitations (account_id, email, invitation_code, invitation_code_expiration)
      VALUES (${accountId}, '${email}', '${invitationCode}', now() + INTERVAL '${invitationCodeTTL} minute')
      RETURNING id, account_id, email, encode(invitation_code, 'escape') as invitation_code, invitation_code_expiration`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function checkInvitationCode(invitationCode){
  try {
    const query = `SELECT id FROM app_invitations WHERE encode(invitation_code, 'escape') = '${invitationCode}' and invitation_code_expiration >= now()`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
 }
}

async function getEmailFromInvitationId(invitationId){
  try {
    const query = `SELECT email FROM app_invitations WHERE id = '${invitationId}'`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
 }
}

async function getInvitationsToEmail(email){
  try {
    const query = `SELECT account_id FROM app_invitations WHERE email = '${email}'`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getInvitationsFromAccount(accountId){
  try {
    const query = `SELECT email FROM app_invitations WHERE account_id = ${accountId}`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function insertInvitationCodeConversion(invitationConversionInfo){
  try {
    const { accountId, invitationCodeId } = invitationConversionInfo
    const query = `
      INSERT INTO app_invitation_conversions (account_id, invitation_code_id)
      VALUES (${accountId}, ${invitationCodeId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function checkInvitationCodeConversion(invitationCodeId){
  try {
    const query = `SELECT id FROM app_invitation_conversions WHERE invitation_code_id = ${invitationCodeId}`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
 }
}

async function getInvitationCodeIdForConvertedAccount(accountId){
  try {
    const query = `SELECT invitation_code_id FROM app_invitation_conversions WHERE account_id = ${accountId}`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
 }
}

module.exports = {
  insertInvitation,
  checkInvitationCode,
  getEmailFromInvitationId,
  getInvitationsToEmail,
  getInvitationsFromAccount,
  insertInvitationCodeConversion,
  checkInvitationCodeConversion,
  getInvitationCodeIdForConvertedAccount,
}
