const { pool, pgTransaction } = require('../pg_helpers')

async function insertTopic(info){
  try {
    const { accountId, topic } = info
    const query = `
      INSERT INTO topics (account_id, topic)
      VALUES (${accountId}, '${topic}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

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

// async function insertThreadParticipantRole(info){
//   try {
//     const { threadId, accountId, role } = info
//     const query = `
//       INSERT INTO thread_participant_roles (thread_id, account_id, role)
//       VALUES (${threadId}, ${accountId}, '${role}')
//       RETURNING *`
//     const result = await pgTransaction(query)
//     return result.rows[0]
//   } catch (error) {
//     console.error(error.stack)
//     throw new Error(error)
//   }
// }
//
// // TODO: Needs testing
// async function selectThreadInfo(threadId){
//   try {
//     const query = `
//       SELECT
//         t.id,
//         topic_id,
//         topic,
//         private,
//         start_time
//       FROM threads as t
//       WHERE id = ${threadId}`
//     return pool
//             .query(query)
//             .then(res => res.rows)
//             .catch(error => new Error(error))
//   } catch (error) {
//     throw new Error(error)
//   }
// }
//
// // TODO: Needs testing
// async function joinThread(info){
//   const { accountId, threadId } = info
//
// }
//
// async function updateParticipantRole(info){
//   try {
//     const { threadId, accountId, role } = info
//     const query = `
//       UPDATE thread_participants
//       SET role = '${role}'
//       WHERE thread_id = ${threadId} and account_id = ${accountId}
//       RETURNING *`
//     const result = await pgTransaction(query)
//     return result.rows[0]
//   } catch (error) {
//     console.error(error.stack)
//     throw new Error(error)
//   }
// }
//
// async function updateRemoveParticipant(info){
//   try {
//     const { threadId, accountId } = info
//     const query = `
//       UPDATE thread_participants
//       SET removed = True
//       WHERE thread_id = ${threadId} and account_id = ${accountId}
//       RETURNING *`
//     const result = await pgTransaction(query)
//     return result.rows[0]
//   } catch (error) {
//     console.error(error.stack)
//     throw new Error(error)
//   }
// }
//
// async function updateEndThread(threadId){
//   try {
//     const query = `UPDATE threads SET end_time = now() WHERE id = ${threadId} RETURNING *`
//     const result = await pgTransaction(query)
//     return result.rows[0]
//   } catch (error) {
//     console.error(error.stack)
//     throw new Error(error)
//   }
// }
//
// async function insertThreadInvitation(info){
//   try {
//     const { threadId, moderatorId, inviteeEmail } = info
//     const query = `
//       INSERT INTO thread_invitations (thread_id, moderator_id, invitee_email)
//       VALUES (${threadId}, ${moderatorId}, '${inviteeEmail}')
//       RETURNING *`
//     const result = await pgTransaction(query)
//     return result.rows[0]
//   } catch (error) {
//     console.error(error.stack)
//     throw new Error(error)
//   }
// }

module.exports = {
  insertTopic,
  insertThreadToStart,
  insertThreadInvitation,
}
