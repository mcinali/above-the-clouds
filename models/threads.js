const { pgTransaction } = require('../pg_helpers')

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
    const { } = info
    const query = ``
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
}
