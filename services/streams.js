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

// Get Stream Information
async function getStreamInfo(streamId){
  try {
    const streamDetails = await getStreamDetails(streamId)
    const streamParticipants = await getStreamParticipants(streamId)
    const streamInvites = await getStreamInvitations(streamId)

    const results = {}
    results['info'] = streamDetails
    results['participants'] = streamParticipants
    results['invites'] = streamInvites
    return results
  } catch (error) {
    throw new Error(error)
  }
}

// Invite Participant to Stream
async function inviteParticipantToStream(inviteInfo){
  try {
    // TO DO: Send invite email
    // TO DO: Convert username to account id
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
    // TO DO: Check if user is part of any other streams
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
  getStreamInfo,
  inviteParticipantToStream,
  joinStream,
  leaveStream,
  endStream,
}
