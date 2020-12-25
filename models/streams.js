const { pool, pgTransaction } = require('../pg_helpers')

async function insertStream(streamInfo){
  try {
    const { topicId, accountId, speakerAccessibility, capacity } = streamInfo
    const query = `
      INSERT INTO streams (topic_id, creator_id, speaker_accessibility, capacity)
      VALUES (${topicId}, ${accountId}, '${speakerAccessibility}', ${capacity})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function getStreamDetails(streamId){
  try {
    const query = `
      SELECT id, topic_id, creator_id, speaker_accessibility, capacity, start_time, end_time
      FROM streams where id = ${streamId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function insertStreamInvitation(inviteInfo){
  try {
    const { streamId, accountId, inviteeAccountId } = inviteInfo
    const inviteeAccountIdFormatted = (inviteeAccountId) ? inviteeAccountId : null
    const query = `
      INSERT INTO stream_invitations (stream_id, account_id, invitee_account_id)
      VALUES (${streamId}, ${accountId}, ${inviteeAccountIdFormatted})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function getStreamInvitations(streamId){
  try {
    const query = `
      SELECT id, stream_id, account_id, invitee_account_id
      FROM stream_invitations WHERE stream_id = ${streamId}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function insertStreamEmailOutreach(inviteInfo){
  try {
    const { streamId, accountId, inviteeEmail } = inviteInfo
    const inviteeEmailFormatted = (inviteeEmail) ? `'${inviteeEmail}'` : null
    const query = `
      INSERT INTO stream_email_outreach (stream_id, account_id, invitee_email)
      VALUES (${streamId}, ${accountId}, ${inviteeEmailFormatted})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function insertStreamParticipant(info){
  try {
    const { streamId, accountId } = info
    const query = `
      INSERT INTO stream_participants (stream_id, account_id)
      VALUES (${streamId}, ${accountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function getStreamParticipants(streamId){
  try {
    const query = `
      SELECT id, stream_id, account_id, start_time, end_time
      FROM stream_participants WHERE stream_id = ${streamId} and end_time is null`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function updateStreamParticipantEndTime(id){
  try {
    const query = `
      UPDATE stream_participants
      SET end_time = now()
      WHERE id = ${id}
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

async function updateStreamEndTime(id){
  try {
    const query = `
      UPDATE streams
      SET end_time = now()
      WHERE id = ${id}
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

module.exports = {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamEmailOutreach,
  insertStreamParticipant,
  getStreamParticipants,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
}
