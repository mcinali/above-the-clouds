const { pool, pgTransaction } = require('../pg_helpers')

async function getStreamCreationsForAccount(accountId, lookbackHours){
  try {
    const query = `
      SELECT id, creator_id
      FROM streams
      WHERE creator_id = ${accountId}
      AND created_at + INTERVAL '${lookbackHours} hour' > now()`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getStreamInvitationsForAccount(accountId, lookbackHours){
  try {
    const query = `
      SELECT id, stream_id, account_id, invitee_account_id
      FROM stream_invitations
      WHERE invitee_account_id = ${accountId}
      AND created_at + INTERVAL '${lookbackHours} hour' > now()`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  getStreamInvitationsForAccount,
  getStreamCreationsForAccount,
}
