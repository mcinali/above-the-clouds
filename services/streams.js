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
const { getAccountInfo, getAccountDetails, getAccountIdFromEmail } = require('../models/accounts')
const { getAccountConnections, checkConnection } = require('../models/connections')
const { getTopicInfo } = require('../models/topics')
const { sendEmail } = require('../sendgrid')
const { twilioClient } = require('../twilio')

// Create Stream
async function createStream(streamInfo){
  try {
    const stream = await insertStream(streamInfo)
    const { invitees } = streamInfo
    const streamInvitees = await Promise.all(invitees.map((invitee) => {
      return inviteParticipantToStream({
        streamId: stream.id,
        accountId: streamInfo.accountId,
        inviteeAccountId: invitee.accountId,
        inviteeEmail: invitee.email,
      })
    }))
    const twilioRoom = await twilioClient.video.rooms.create({
                              type: 'group-small',
                              uniqueName: stream.id.toString(),
                            })
    return {
      'streamId': stream.id,
      'topicId': stream.topicId,
      'startTime': stream.startTime,
      'endTime': stream.endTime,
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Get Stream Basic Info
async function getStreamBasicInfo(streamId){
  try {
    const streamDetails = await getStreamDetails(streamId)
    const topicInfo = await getTopicInfo(streamDetails.topicId)
    return {
      'streamId': streamDetails.id,
      'topicId': streamDetails.topicId,
      'topic': topicInfo.topic,
      'creatorId': streamDetails.creatorId,
      'capacity': streamDetails.capacity,
      'speakerAccessibility': streamDetails.speakerAccessibility,
      'startTime': streamDetails.startTime,
      'endTime': streamDetails.endTime,
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Get Stream Participants Info
async function getStreamParticipantsInfo(streamId){
  try {
    const streamParticipants = await getStreamParticipants(streamId)
    const participants = streamParticipants.map(async (participant) => {
      const participantInfo = await getAccountInfo(participant.accountId)
      const participantDetails = await getAccountDetails(participant.accountId)
      return {
        'streamParticipantId': participant.id,
        'accountId': participant.accountId,
        'username': participantInfo.username,
        'firstname': participantDetails.firstname,
        'lastnameInitial': participantDetails.lastname.slice(0,1),
        'startTime': participant.startTime,
      }
    })
    return Promise.all(participants)
  } catch (error) {
    throw new Error(error)
  }
}

// Get Stream Invitees Info
async function getStreamInviteesInfo(streamId){
  try {
    const streamInvites = await getStreamInvitations(streamId)
    const invitees = streamInvites.map(async (invitee) => {
      const inviteeInfo = await getAccountInfo(invitee.inviteeAccountId)
      const inviteeDetails = await getAccountDetails(invitee.inviteeAccountId)
      return {
        'streamInviteId': invitee.id,
        'accountId': invitee.accountId,
        'inviteeAccountId': invitee.inviteeAccountId,
        'username': inviteeInfo.username,
        'firstname': inviteeDetails.firstname,
        'lastnameInitial': inviteeDetails.lastname.slice(0,1),
      }
    })
    return Promise.all(invitees)
  } catch (error) {
    throw new Error(error)
  }
}

// Get Stream Email Outreach Info
async function getStreamEmailOutreachInfo(streamId){
  try {
    const emailOutreach = await getStreamInvitationsFromEmailOutreach(streamId)
    const emailOutreachFrmtd = await Promise.all(emailOutreach.map(async (outreach) => {
      const emailAccountId = await getAccountIdFromEmail(outreach.inviteeEmail)
      return {
        'emailOutreachId':outreach.id,
        'invitedBy':outreach.accountId,
        'inviteeEmail':outreach.inviteeEmail,
        'createdAt':outreach.createdAt,
        'emailAccountId':(emailAccountId) ? emailAccountId : null,
      }
    }))
    const emailOutreachFltred = emailOutreachFrmtd.filter(function(outreach){
      if (!outreach.emailAccountId) {return outreach}
    })
    return Promise.all(emailOutreachFltred)
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
    // Collection components of stream info: basic + participants + invitees + email outreach
    const basicInfo = await getStreamBasicInfo(streamId)
    const participants = await getStreamParticipantsInfo(streamId)
    const invitees = await getStreamInviteesInfo(streamId)
    const emailOutreach = await getStreamEmailOutreachInfo(streamId)
    return {
      'info': basicInfo,
      'participants': participants,
      'invitees': invitees,
      'emailOutreach':emailOutreach,
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
    const topic = await getTopicInfo(streamDetails.topicId)
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
    // End participation in stream
    const streamParticipants = await getStreamParticipants(streamId)
    const streamParticipantsFltrd = streamParticipants.filter(function(participant){
      if (!participant.endTime) {return participant}
    })
    const streamParticipantEnds = await Promise.all(streamParticipantsFltrd.map(async function(participant){
      return await updateStreamParticipantEndTime(participant.id)
    }))
    // End stream
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
  getStreamBasicInfo,
  getStreamParticipantsInfo,
  getStreamInfo,
  inviteParticipantToStream,
  joinStream,
  leaveStream,
  endStream,
}
