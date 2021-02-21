const { getTopicInfo } = require('../models/topics')
const {
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
} = require('../models/streams')
const { getAccountInfo, getAccountDetails, getProfilePic } = require('../models/accounts')
const { getAccountsFollowing } = require('../models/follows')
const { sendEmail } = require('../sendgrid')
const { twilioClient, createTwilioRoomAccessToken } = require('../twilio')
const { webURL } = require('../config')

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
      })
    }))
    const twilioRoom = await twilioClient.video.rooms.create({
                              type: 'group-small',
                              uniqueName: stream.id.toString(),
                            })
    return {
      streamId: stream.id,
      topicId: stream.topicId,
      startTime: stream.startTime,
      endTime: stream.endTime,
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
      streamId: streamDetails.id,
      topicId: streamDetails.topicId,
      topic: topicInfo.topic,
      creatorId: streamDetails.creatorId,
      capacity: streamDetails.capacity,
      inviteOnly: streamDetails.inviteOnly,
      startTime: streamDetails.startTime,
      endTime: streamDetails.endTime,
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Get Stream Participants Info
async function getStreamParticipantsInfo(accountId, streamId){
  try {
    const streamParticipants = await getStreamParticipants(streamId)
    const accountFollowingRows = await getAccountsFollowing(accountId)
    const accountFollowing = accountFollowingRows.map(item => item.accountId)
    const participants = streamParticipants.map(async (participant) => {
      const participantInfo = await getAccountInfo(participant.accountId)
      const participantDetails = await getAccountDetails(participant.accountId)
      const profilePic = await getProfilePic(participant.accountId)
      const profilePicture = (profilePic) ? profilePic.profilePicture : null
      const following = (participant.accountId==accountId) ? null : (accountFollowing.includes(participant.accountId)) ? true : false
      return {
        streamParticipantId: participant.id,
        accountId: participant.accountId,
        username: participantInfo.username,
        firstname: participantDetails.firstname,
        lastname: participantDetails.lastname,
        profilePicture: profilePicture,
        following: following,
        startTime: participant.startTime,
      }
    })
    return Promise.all(participants)
  } catch (error) {
    throw new Error(error)
  }
}

// Get Stream Invitees Info
async function getStreamInviteesInfo(accountId, streamId){
  try {
    const streamInvites = await getStreamInvitations(streamId)
    const accountFollowingRows = await getAccountsFollowing(accountId)
    const accountFollowing = accountFollowingRows.map(item => item.accountId)
    const invitees = streamInvites.map(async (invitee) => {
      const inviteeInfo = await getAccountInfo(invitee.inviteeAccountId)
      const inviteeDetails = await getAccountDetails(invitee.inviteeAccountId)
      const profilePic = await getProfilePic(invitee.inviteeAccountId)
      const profilePicture = (profilePic) ? profilePic.profilePicture : null
      const following = (invitee.accountId==accountId) ? null : (accountFollowing.includes(invitee.accountId)) ? true : false
      return {
        accountId: invitee.accountId,
        inviteeAccountId: invitee.inviteeAccountId,
        username: inviteeInfo.username,
        firstname: inviteeDetails.firstname,
        lastname: inviteeDetails.lastname,
        profilePicture: profilePicture,
        following: following,
        ts: invitee.createdAt,
      }
    })
    return Promise.all(invitees)
  } catch (error) {
    throw new Error(error)
  }
}

// Get Stream Information
async function getStreamInfo(input){
  try {
    const { streamId, accountId } = input

    const streamDetails = await getStreamDetails(streamId)
    // Check if stream exists
    if(!Boolean(streamDetails)){
      throw new Error('Stream does not exist')
    }
    // Collection components of stream info: basic + participants + invitees + email outreach
    const basicInfo = await getStreamBasicInfo(streamId)
    const participants = await getStreamParticipantsInfo(accountId, streamId)
    const inAppInvitees = await getStreamInviteesInfo(accountId, streamId)
    const invitees = inAppInvitees
    invitees.sort((a,b) => (a.ts < b.ts) ? 1 : -1)
    return {
      info: basicInfo,
      participants: participants,
      invitees: invitees,
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Invite Participant to Stream
async function inviteParticipantToStream(inviteInfo){
  try {
    // TO DO: Send invite email
    const { streamId, accountId, inviteeAccountId } = inviteInfo
    // Check to make sure user has permission to invite others to stream
    const streamDetails = await getStreamDetails(streamId)
    // Instantiate email
    const account = await getAccountInfo(accountId)
    const accountUsername = account.username
    const accountDetails = await getAccountDetails(accountId)
    const topic = await getTopicInfo(streamDetails.topicId)
    const inviteeAccount = await getAccountInfo(inviteeAccountId)
    const inviteeAccountDetails = await getAccountDetails(inviteeAccountId)
    const profilePic = await getProfilePic(inviteeAccountId)
    const profilePicture = (profilePic) ? profilePic.profilePicture : null
    const accountFollowingRows = await getAccountsFollowing(accountId)
    const accountFollowing = accountFollowingRows.map(item => item.accountId)
    const following = (inviteeAccountId==accountId) ? null : (accountFollowing.includes(inviteeAccountId)) ? true : false
    const msg = {
      from: 'abovethecloudsapp@gmail.com',
      to: inviteeAccountDetails.email,
      subject: `${accountDetails.firstname} ${accountDetails.lastname} (${accountUsername}) invited you to their stream`,
      text: `${accountDetails.firstname} ${accountDetails.lastname} (${accountUsername}) invited you to their stream "${topic.topic}".

      Join now: ${webURL}/stream?streamId${streamId}`,
    }
    // Insert stream invitation into DB
    const streamInvitation = await insertStreamInvitation(inviteInfo)
    // Send email
    sendEmail(msg)
    return {
      accountId: accountId,
      inviteeAccountId: inviteeAccountId,
      username: inviteeAccount.username,
      firstname: inviteeAccountDetails.firstname,
      lastname: inviteeAccountDetails.lastname,
      profilePicture: profilePicture,
      following: following,
      ts: streamInvitation.createdAt,
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
    // Throw errors if stream does not exist or if stream is no longer active
    if (streamDetails.endTime){
      throw new Error('Stream is inactive. Users cannot join inactive streams.')
    }
    // Throw error if user is active in another stream
    const activeUserStreams = await getActiveAccountStreams(accountId)
    const otherActiveUserStreams = activeUserStreams.filter(function(userStream){
      if (userStream.streamId!==streamId) { return userStream }
    })
    if (otherActiveUserStreams.length > 0){
      throw new Error('User already active in another stream')
    }
    // Enable streaming if user is already active in this stream
    const streamParticipants = await getStreamParticipants(streamId)
    const accountInStream = streamParticipants.filter(item => {if (item.accountId===accountId){return item}})
    if (Boolean(accountInStream[0])) {
      const streamInfo = accountInStream[0]
      const twilioUserId = streamInfo.accountId.toString()
      const twilioUniqueRoomName = streamInfo.streamId.toString()
      const twilioAccessToken = createTwilioRoomAccessToken(twilioUserId, twilioUniqueRoomName)
      return {
        streamParticipantId: streamInfo.id,
        streamId: streamInfo.streamId,
        accountId: streamInfo.accountId,
        startTime: streamInfo.startTime,
        twilioAccessToken: twilioAccessToken,
      }
    }
    // Throw error if stream is already at capacity
    if (streamParticipants.length >= streamDetails.capacity){
      throw new Error('Stream is at capacity. Users cannot join streams without capacity.')
    }
    // Throw error if stream is invite-only & user is not the stream creator and has not been invited to the stream
    const inviteOnly = streamDetails.inviteOnly
    const streamCreatorId = streamDetails.creatorId
    const streamInvitees = await getStreamInvitations(streamId)
    const streamInviteesFlrtd = streamInvitees.filter(function(streamInvite){
      if (streamInvite.inviteeAccountId===accountId) {return streamInvite}
    })
    if (inviteOnly){
      if (streamInviteesFlrtd.length==0 && streamCreatorId!==accountId){
        throw new Error('Stream is invite-only. User does not have permission to participate in stream.')
      }
    } else {
      // Throw error if stream is not invite-only, but no one in user's network is active in stream
      const accountsFollowingRows = await getAccountsFollowing(accountId)
      const accountsFollowing = accountsFollowingRows.map(item => item.accountId)
      const networkAccountIdsSet = new Set(accountsFollowing)
      await Promise.all(accountsFollowing.map(async (accountId) => {
        const followingRows = await getAccountsFollowing(accountId)
        followingRows.map(row => networkAccountIdsSet.add(row.accountId))
      }))
      const networkAccountIds = [...networkAccountIdsSet]
      const streamParticipantAccountIds = streamParticipants.map(item => item.accountId)
      const fltrdAccountIds = networkAccountIds.filter(accountId => streamParticipantAccountIds.includes(accountId))
      if (fltrdAccountIds.length == 0 && streamInviteesFlrtd.length==0 && streamCreatorId!==accountId){
        throw new Error('User does not have permission to participate in stream.')
      }
    }
    const streamParticipant = await insertStreamParticipant(joinInfo)
    const twilioUserId = streamParticipant.accountId.toString()
    const twilioUniqueRoomName = streamParticipant.streamId.toString()
    const twilioAccessToken = createTwilioRoomAccessToken(twilioUserId, twilioUniqueRoomName)
    return {
      streamParticipantId: streamParticipant.id,
      streamId: streamParticipant.streamId,
      accountId: streamParticipant.accountId,
      startTime: streamParticipant.startTime,
      twilioAccessToken: twilioAccessToken,
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
    if (Boolean(streamParticipantDetails.endTime)){
      return 'User has already left stream'
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
      streamId:streamId,
      accountId:streamParticipantEndTime.accountId,
      participantEndTime:streamParticipantEndTime.endTime,
      streamEndTime:streamDetails.endTime,
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
      streamId:streamId,
      endTime:streamEndTime.endTime,
    }
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createStream,
  getStreamBasicInfo,
  getStreamInfo,
  inviteParticipantToStream,
  joinStream,
  leaveStream,
  endStream,
}
