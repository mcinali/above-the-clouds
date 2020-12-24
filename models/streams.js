const { pool, pgTransaction } = require('../pg_helpers')

async function insertThreadToStart(info){
  try {
    const { topicId, accountId} = info
    const query = `
      INSERT INTO threads (topic_id, creator_id)
      VALUES (${topicId}, ${accountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function insertThreadInvitation(inviteInfo){
  try {
    const { threadId, inviterAccountId, inviteeAccountId, inviteeEmail } = inviteInfo
    const email = (inviteeEmail) ? `'${inviteeEmail}'` : inviteeEmail
    const query = `
      INSERT INTO thread_invitations ( thread_id, inviter_account_id, invitee_account_id, invitee_email )
      VALUES (${threadId}, ${inviterAccountId}, ${inviteeAccountId}, ${email})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

module.exports = {
  insertThreadToStart,
  insertThreadInvitation,
}
