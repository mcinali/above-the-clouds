const { pool, pgTransaction } = require('../pg_helpers')

async function getActiveStreamInvitationsForAccount(accountId){
  try {
    const query = `
      SELECT id, stream_id, account_id, invitee_account_id
      FROM stream_invitations
      WHERE invitee_account_id = ${accountId}
      AND stream_id in (SELECT id FROM streams WHERE end_time is null)`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getActivePublicStreams(limit){
  try {
    const query = `
      SELECT *
      FROM streams
      WHERE invite_only = false
      AND end_time is null
      ORDER BY start_time desc
      LIMIT ${limit}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  getActiveStreamInvitationsForAccount,
  getActivePublicStreams,
}
