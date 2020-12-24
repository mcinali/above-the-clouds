const {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamParticipant,
  getStreamParticipants,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
} = require('../models/streams')

// Create Stream
async function createStream(streamInfo){
  try {
    const results = insertStream(streamInfo)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

// Create Stream
async function inviteParticipantToStream(inviteInfo){
  try {
    // TO DO: Send invite email
    const results = insertStreamInvitation(inviteInfo)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

// Join Stream
async function joinStream(joinInfo){
  try {
    // TO DO: Check if user is allowed to join stream
    const results = insertStreamParticipant(joinInfo)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

// Leave Stream
async function leaveStream(streamParticipantId){
  try {
    // TO DO: Check if participant already left stream
    const results = updateStreamParticipantEndTime(streamParticipantId)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

// End Stream
async function endStream(streamId){
  try {
    // TO DO: Check if stream has already ended
    const results = updateStreamEndTime(streamId)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createStream,
  inviteParticipantToStream,
  joinStream,
  leaveStream,
  endStream,
}
