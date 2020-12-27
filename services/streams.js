const {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamEmailOutreach,
  getStreamInvitationsFromEmailOutreach,
  insertStreamParticipant,
  getStreamParticipants,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
} = require('../models/streams')
const { getAccountIdFromEmail } = require('../models/accounts')

// Create Stream
async function createStream(streamInfo){
  try {
    const stream = await insertStream(streamInfo)
    return {
      'streamId': stream.id,
      'topicId': stream.topicId,
      'creatorId': stream.creatorId,
      'capacity': stream.capacity,
      'speakerAccessibility': stream.speakerAccessibility,
      'startTime': stream.startTime,
      'endTime': stream.endTime
    }
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

    const info = {
      'streamId': streamDetails.id,
      'topicId': streamDetails.topicId,
      'creatorId': streamDetails.creatorId,
      'capacity': streamDetails.capacity,
      'speakerAccessibility': streamDetails.speakerAccessibility,
      'startTime': streamDetails.startTime,
      'endTime': streamDetails.endTime,
    }
    const participants = streamParticipants.map((participant) => ({
      'streamParticipantId': participant.id,
      'accountId': participant.accountId,
      'startTime': participant.startTime,
    }))
    const invitees = streamInvites.map((invitee) => ({
      'streamInviteId': invitee.id,
      'accountId': invitee.accountId,
      'inviteeAccountId': invitee.inviteeAccountId,
    }))
    return {
      'info': info,
      'participants': participants,
      'invitees': invitees,
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Invite Participant to Stream
async function inviteParticipantToStream(inviteInfo){
  try {
    // TO DO: Send invite email
    const connectionId = inviteInfo.inviteeAccountId
    const email = inviteInfo.inviteeEmail
    // Insert connection id into connections if exists
    if (connectionId) {
      const streamInvitation = await insertStreamInvitation(inviteInfo)
      return {
        'streamInvitationId': streamInvitation.id,
        'streamId': streamInvitation.streamId,
        'accountId': streamInvitation.accountId,
        'inviteeAccountId': streamInvitation.inviteeAccountId,
      }
    } else if (email) {
      const streamEmailOutreach = await insertStreamEmailOutreach(inviteInfo)
      return {
        'streamEmailOutreachId': streamEmailOutreach.id,
        'streamId': streamEmailOutreach.streamId,
        'accountId': streamEmailOutreach.accountId,
        'inviteeEmail': streamEmailOutreach.inviteeEmail,
      }
    } else {
      return 'Failed: Unable to invite participant to stream'
    }
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
