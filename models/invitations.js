const { pool, pgTransaction } = require('../pg_helpers')

async function insertInvitation(invitationInfo){
  try {
    const { accountId, email } = invitationInfo
    const query = `
      INSERT INTO app_invitations (account_id, email)
      VALUES (${accountId}, '${email}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
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
  getInvitationsToEmail,
  getInvitationsFromAccount,
}
