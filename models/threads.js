const { pool, pgTransaction } = require('../pg_helpers')

async function selectPossibleThreadsForUser(accountId){
  try {
    const query = `
      SELECT
        t.id,
        topic_id,
        topic,
        private,
        start_time
      FROM threads as t
      JOIN topics as p
      ON t.topic_id = p.id
      WHERE (account_id in (SELECT account_id FROM thread_participants WHERE removed = False) OR private = False)
      AND end_time is null
      ORDER BY private desc, start_time - now() desc`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function selectThreadParticipants(threadId){
  try {
    const query = `
      SELECT
        account_id,
        role,
        removed
      FROM thread_participants
      ORDER BY role desc`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

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
    const { topicId, accountId, private } = info
    const query = `
      INSERT INTO threads (topic_id, creator_id, private)
      VALUES (${topicId}, ${accountId}, ${private})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function updateEndThread(threadId){
  try {
    const query = `UPDATE threads SET end_time = now() WHERE id = ${threadId} RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function insertThreadParticipant(info){
  try {
    const { threadId, accountId, role } = info
    const query = `
      INSERT INTO thread_participants (thread_id, account_id, role)
      VALUES (${threadId}, ${accountId}, '${role}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function updateParticipantRole(info){
  try {
    const { threadId, accountId, role } = info
    const query = `
      UPDATE thread_participants
      SET role = '${role}'
      WHERE thread_id = ${threadId} and account_id = ${accountId}
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function updateRemoveParticipant(info){
  try {
    const { threadId, accountId } = info
    const query = `
      UPDATE thread_participants
      SET removed = True
      WHERE thread_id = ${threadId} and account_id = ${accountId}
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function insertThreadInvitation(info){
  try {
    const { threadId, moderatorId, inviteeEmail } = info
    const query = `
      INSERT INTO thread_invitations (thread_id, moderator_id, invitee_email)
      VALUES (${threadId}, ${moderatorId}, '${inviteeEmail}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

module.exports = {
  insertTopic,
  insertThreadToStart,
  updateEndThread,
  insertThreadParticipant,
  updateParticipantRole,
  updateRemoveParticipant,
  insertThreadInvitation,
  selectPossibleThreadsForUser,
  selectThreadParticipants,
}
