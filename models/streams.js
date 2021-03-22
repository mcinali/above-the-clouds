const { pool, pgTransaction } = require('../pg_helpers')

async function insertStream(streamInfo){
  try {
    const { topicId, accountId, inviteOnly, capacity, startTime } = streamInfo
    const startTimeFrmtd = (startTime) ? `'${startTime}'` : 'now()'
    const query = `
      INSERT INTO streams (topic_id, creator_id, invite_only, capacity, start_time)
      VALUES (${topicId}, ${accountId}, ${inviteOnly}, ${capacity}, ${startTimeFrmtd})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getStreamDetails(streamId){
  try {
    const query = `
      SELECT id, topic_id, creator_id, invite_only, capacity, start_time, end_time, created_at
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
    throw new Error(error)
  }
}

async function getStreamInvitations(streamId){
  try {
    const query = `
      SELECT id, stream_id, account_id, invitee_account_id, created_at
      FROM stream_invitations WHERE stream_id = ${streamId}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
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
    throw new Error(error)
  }
}

async function getStreamParticipantDetails(streamParticipantId){
  try {
    const query = `SELECT * FROM stream_participants WHERE id = ${streamParticipantId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
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

async function getActiveAccountStreams(accountId){
  try {
    const query = `SELECT * FROM stream_participants WHERE account_id = ${accountId} and end_time is null`
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
    throw new Error(error)
  }
}

async function getScheduledStreamsForReminders(mins){
  try {
    const query = `
      SELECT * FROM streams WHERE start_time > now() AND start_time < now() + INTERVAL '${mins} mins'`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function insertStreamReminder(info){
  try {
    const { streamId, accountId } = info
    const query = `
      INSERT INTO stream_reminders (stream_id, account_id)
      VALUES (${streamId}, ${accountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getStreamReminders(streamId){
  try {
    const query = `SELECT * FROM stream_reminders WHERE stream_id = ${streamId}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamParticipant,
  getStreamParticipantDetails,
  getStreamParticipants,
  getActiveAccountStreams,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
  getScheduledStreamsForReminders,
  insertStreamReminder,
  getStreamReminders,
}
