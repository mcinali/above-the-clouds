const {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamEmailOutreach,
  getStreamInvitationsFromEmailOutreach,
  insertStreamParticipant,
  getStreamParticipants,
  getActiveAccountStreams,
  getStreamParticipantDetails,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
} = require('../models/streams')
const { getAccountInfo, getAccountDetails } = require('../models/accounts')
const { getAccountConnections, checkConnection } = require('../models/connections')
const { getTopic } = require('../models/topics')
const { sendEmail } = require('../sendgrid')

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
async function getStreamInfo(input){
  try {
    const { streamId, accountId } = input

    const streamDetails = await getStreamDetails(streamId)
    const streamParticipants = await getStreamParticipants(streamId)
    const streamInvites = await getStreamInvitations(streamId)
    // Check if stream exists
    if(!Boolean(streamDetails)){
      throw new Error('Stream does not exist')
    }
    // Check to make sure user has permission to get stream details
    const streamParticipantsFltrd = streamParticipants.filter(function(streamParticipant){
      if (streamParticipant.accountId==accountId) {return streamParticipant}
    })
    if (streamParticipantsFltrd.length==0 && streamDetails.creatorId!=accountId){
      throw new Error('User must be active in stream or stream creator to get stream details')
    }
    //
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
    const { streamId, accountId } = inviteInfo
    const inviteeAccountId = (inviteInfo.inviteeAccountId) ? inviteInfo.inviteeAccountId : null
    const inviteeEmail = (inviteInfo.inviteeEmail) ? inviteInfo.inviteeEmail : null
    // Check to make sure user has permission to invite others to stream
    const streamDetails = await getStreamDetails(streamId)
    const streamParticipants = await getStreamParticipants(streamId)
    const streamParticipantsFltrd = streamParticipants.filter(function(streamParticipant){
      if (streamParticipant.accountId==accountId) {return streamParticipant}
    })
    if (streamParticipantsFltrd.length === 0 && streamDetails.creatorId!=accountId){
      throw new Error('User must be active in stream or stream creator to invite others to stream')
    }
    // Instantiate email
    const account = await getAccountInfo(accountId)
    const accountUsername = account.username
    const accountDetails = await getAccountDetails(accountId)
    const topic = await getTopic(streamDetails.topicId)
    const inviteeAccountDetails = await getAccountDetails(inviteeAccountId)
    const msg = {
      from: 'abovethecloudsapp@gmail.com',
      to: (inviteeAccountDetails) ? inviteeAccountDetails.email : inviteeEmail,
      subject: `${accountDetails.firstname} ${accountDetails.lastname.slice(0,1)} (${accountUsername}) invited you to their stream`,
      text: `${accountDetails.firstname} ${accountDetails.lastname.slice(0,1)} (${accountUsername}) invited you to their stream "${topic.topic}". Join now!`,
    }
    // Insert connection id into connections if exists
    if (inviteeAccountId) {
      const streamInvitation = await insertStreamInvitation(inviteInfo)
      sendEmail(msg)
      return {
        'streamInvitationId': streamInvitation.id,
        'streamId': streamInvitation.streamId,
        'accountId': streamInvitation.accountId,
        'inviteeAccountId': streamInvitation.inviteeAccountId,
      }
    } else if (inviteeEmail) {
      const streamEmailOutreach = await insertStreamEmailOutreach(inviteInfo)
      sendEmail(msg)
      return {
        'streamEmailOutreachId': streamEmailOutreach.id,
        'streamId': streamEmailOutreach.streamId,
        'accountId': streamEmailOutreach.accountId,
        'inviteeEmail': streamEmailOutreach.inviteeEmail,
      }
    } else {
      throw new Error('Unable to invite participant to stream')
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Join Stream
async function joinStream(joinInfo){
  try {
    const streamId = joinInfo.streamId
    const accountId = joinInfo.accountId
    const streamDetails = await getStreamDetails(streamId)
    const streamParticipants = await getStreamParticipants(streamId)
    // Check if stream exists
    // Check if stream is active
    // Check if stream is at capacity
    if (!Boolean(streamDetails)){
      throw new Error('Stream does not exist')
    } else if (streamDetails.endTime){
      throw new Error('Stream is inactive. Users cannot join inactive streams.')
    } else if (streamParticipants.length >= streamDetails.capacity){
      throw new Error('Stream is at capacity. Users cannot join streams without capacity.')
    }
    // Check if user is already active in other streams
    const userStreams = await getActiveAccountStreams(accountId)
    const userStreamsFltrd = userStreams.filter(function(userStream){
      if (userStream.streamId!==streamId) { return userStream }
    })
    if (userStreamsFltrd.length > 0){
      throw new Error('User already active in another stream')
    } else if (userStreams.length > 0) {
      throw new Error('User already active in this stream')
    } else {
      // Reject user if they are not allowed to join stream
      const speakerAccessibility = streamDetails.speakerAccessibility
      const streamCreatorId = streamDetails.creatorId
      const streamInvitees = await getStreamInvitations(streamId)
      const streamInviteesFlrtd = streamInvitees.filter(function(streamInvite){
        if (streamInvite.inviteeAccountId===accountId) {return streamInvite}
      })
      if (streamInviteesFlrtd.length==0){
        if (speakerAccessibility==='invite-only' && streamCreatorId!==accountId){
          throw new Error('Stream is invite-only. User does not have permission to participate in stream.')
        } else if (speakerAccessibility==='network-only' && streamCreatorId!==accountId){
          const participantConnectionCheck = await Promise.all(streamParticipants.map(async (participant) => {
            const connection1 = await checkConnection({'accountId':accountId,'connectionId':participant.accountId})
            const connection2 = await checkConnection({'accountId':participant.accountId,'connectionId':accountId})
            if (Boolean(connection1) && Boolean(connection2)){
              return {'speakerId':participant.accountId}
            }
          }))
          const participantConnectionCheckFltrd = participantConnectionCheck.filter(function(x) {if (x) {return x}})
          if (participantConnectionCheckFltrd.length==0){
            throw new Error('Stream is network-only. User is not invited & not part of speaker network')
          }
        }
      }
      const streamParticipant = await insertStreamParticipant(joinInfo)
      return {
        'streamParticipantId': streamParticipant.id,
        'streamId': streamParticipant.streamId,
        'accountId': streamParticipant.accountId,
        'startTime': streamParticipant.startTime,
      }
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Leave Stream
async function leaveStream(streamParticipantId){
  try {
    // Check if participant already left stream
    const streamParticipantDetails = await getStreamParticipantDetails(streamParticipantId)
    if (!Boolean(streamParticipantDetails)){
      throw new Error('Stream Participant Id does not exist')
    } else if (Boolean(streamParticipantDetails.endTime)){
      throw new Error('User has already left stream')
    }
    // Set end time for user participation in stream
    const streamParticipantEndTime = await updateStreamParticipantEndTime(streamParticipantId)
    // End stream if no more users remain
    const streamId = streamParticipantEndTime.streamId
    const streamParticipants = await getStreamParticipants(streamId)
    const streamParticipantsFlrtd = streamParticipants.filter(function(participant){
      if (!participant.endTime) {return participant}
    })
    if (streamParticipantsFlrtd.length==0) {
      const streamEndTime = await updateStreamEndTime(streamId)
    }
    const streamDetails = await getStreamDetails(streamId)
    return {
      'streamId':streamId,
      'accountId':streamParticipantEndTime.accountId,
      'participantEndTime':streamParticipantEndTime.endTime,
      'streamEndTime':streamDetails.endTime,
    }
  } catch (error) {
    throw new Error(error)
  }
}

// End Stream
async function endStream(streamId){
  try {
    // Check if stream has already ended
    const streamDetails = await getStreamDetails(streamId)
    if (!Boolean(streamDetails)){
      throw new Error('Stream does not exist')
    }
    if (Boolean(streamDetails.endTime)){
      throw new Error('Stream has already ended')
    }
    const streamEndTime = updateStreamEndTime(streamId)
    return {
      'streamId':streamId,
      'endTime':streamEndTime.endTime,
    }
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
