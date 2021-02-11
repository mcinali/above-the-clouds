const { pool, pgTransaction } = require('../pg_helpers')

async function insertInvitation(invitationInfo){
  try {
    const { accountId, email, invitationCode } = invitationInfo
    const query = `
      INSERT INTO app_invitations (account_id, email, invitation_code)
      VALUES (${accountId}, '${email}', '${invitationCode}')
      RETURNING account_id, email, encode(invitation_code, 'escape') as invitation_code`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getEmailFromInvitationCode(invitationCode){
  try {
    const query = `SELECT email FROM app_invitations WHERE encode(invitation_code, 'escape') = '${invitationCode}'`
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

module.exports = {
  insertInvitation,
  getEmailFromInvitationCode,
  getInvitationsToEmail,
  getInvitationsFromAccount,
}
