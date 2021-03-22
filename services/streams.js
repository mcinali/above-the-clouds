const { webURL } = require('../config')
const { sendEmail } = require('../sendgrid')
const { twilioClient, createTwilioRoomAccessToken, sendSMS } = require('../twilio')
const { getTopicInfo } = require('../models/topics')
const { getAccountsFollowing, getAccountFollowers } = require('../models/follows')
const { getAccountDetails } = require('../models/accounts')
const { fetchAccountDetails, fetchAccountDetailsBasic } = require('../services/accounts')
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
  getScheduledStreamsForReminders,
  insertStreamReminder,
  getStreamReminders,
} = require('../models/streams')
const {
  broadcastStreamJoins,
  broadcastStreamLeaves,
  pushNotificationMessage,
} = require('../sockets/sockets')

// Create Stream
async function createStream(streamInfo, app){
  try {
    // Insert stream in DB
    const stream = await insertStream(streamInfo)
    const { invitees } = streamInfo
    // Send stream invites
    const { accountId } = streamInfo
    const streamInvitees = await Promise.all(invitees.map((invitee) => {
      return inviteParticipantToStream(
        {
          streamId: stream.id,
          accountId: accountId,
          inviteeAccountId: invitee.accountId,
        },
        app
      )
    }))
    // Create twilio room
    const twilioRoom = await twilioClient.video.rooms.create({
                              type: 'group-small',
                              uniqueName: stream.id.toString(),
                            })
    // Send notification about stream creation
    const accountDetails = await fetchAccountDetailsBasic(accountId)
    const followers = await getAccountFollowers(accountId)
    const socket = app.get('io')
    const message = `${accountDetails.firstname} ${accountDetails.lastname} (${accountDetails.username}) started an audio room`
    followers.map(follower => pushNotificationMessage(follower.accountId, message, socket))
    // Return results
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
      const participantInfo = await fetchAccountDetailsBasic(participant.accountId)
      const following = (participant.accountId==accountId) ? null : (accountFollowing.includes(participant.accountId)) ? true : false
      return {
        streamParticipantId: participant.id,
        accountId: participant.accountId,
        username: participantInfo.username,
        firstname: participantInfo.firstname,
        lastname: participantInfo.lastname,
        profilePicture: participantInfo.profilePicture,
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
      const inviteeInfo = await fetchAccountDetailsBasic(invitee.inviteeAccountId)
      const following = (invitee.accountId==accountId) ? null : (accountFollowing.includes(invitee.accountId)) ? true : false
      return {
        accountId: invitee.accountId,
        inviteeAccountId: invitee.inviteeAccountId,
        username: inviteeInfo.username,
        firstname: inviteeInfo.firstname,
        lastname: inviteeInfo.lastname,
        profilePicture: inviteeInfo.profilePicture,
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
async function inviteParticipantToStream(inviteInfo, app){
  try {
    // TO DO: Send invite email
    const { streamId, accountId, inviteeAccountId } = inviteInfo
    // Check to make sure user has permission to invite others to stream
    const streamDetails = await getStreamDetails(streamId)
    // Get account details for notifications
    const accountDetails = await fetchAccountDetailsBasic(accountId)
    // Get stream topic
    const topic = await getTopicInfo(streamDetails.topicId)
    // Get invitee account details
    const inviteeAccountDetails = await fetchAccountDetails(inviteeAccountId)
    // Get account following status
    const accountFollowingRows = await getAccountsFollowing(accountId)
    const accountFollowing = accountFollowingRows.map(item => item.accountId)
    const following = (inviteeAccountId==accountId) ? null : (accountFollowing.includes(inviteeAccountId)) ? true : false
    // Insert stream invitation into DB
    const streamInvitation = await insertStreamInvitation(inviteInfo)
    // Send browser push notification
    const messageSubject = `${accountDetails.firstname} ${accountDetails.lastname} (${accountDetails.username}) invited you to their audio room "${topic.topic}"`
    const message = `You've been invited! ${messageSubject}`
    const socket = app.get('io')
    pushNotificationMessage(inviteeAccountId, message, socket)
    // Send text notification
    const phoneNumber = '+1'+inviteeAccountDetails.phone.toString()
    const textMessage = `${messageSubject}:

    Join now: ${webURL}/stream?streamId=${streamId}`
    sendSMS(phoneNumber, textMessage)

    return {
      accountId: accountId,
      inviteeAccountId: inviteeAccountId,
      username: inviteeAccountDetails.username,
      firstname: inviteeAccountDetails.firstname,
      lastname: inviteeAccountDetails.lastname,
      profilePicture: inviteeAccountDetails.profilePicture,
      following: following,
      ts: streamInvitation.createdAt,
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Join Stream
async function joinStream(joinInfo, app){
  try {
    const streamId = joinInfo.streamId
    const accountId = joinInfo.accountId
    const streamDetails = await getStreamDetails(streamId)
    // Throw errors if stream does not exist
    if (!Boolean(streamDetails)){
      throw new Error('Stream does not exist.')
    }
    // Throw errors if stream is no longer active
    if (streamDetails.endTime) {
      throw new Error('Stream is inactive. Users cannot join inactive streams.')
    }
    // Throw errors if stream has not started yet
    if (streamDetails.startTime.getTime() > new Date().getTime()) {
      throw new Error('Stream has not started yet.')
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
    // Broadcast stream join to invitees/followers
    const socket = app.get('io')
    broadcastStreamJoins(joinInfo.accountId, joinInfo.streamId, socket, 'join_stream')
    // Get twilio access token
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
async function leaveStream(body, app){
  try {
    // twilioClient
    const { streamParticipantId, twilioRoomSID, twilioParticipantSID } = body
    // Check if participant already left stream
    const streamParticipantDetails = await getStreamParticipantDetails(streamParticipantId)
    if (Boolean(streamParticipantDetails.endTime)){
      return 'User has already left stream'
    }
    // Parse accountId + streamId from stream participant details
    const accountId = streamParticipantDetails.accountId
    const streamId = streamParticipantDetails.streamId
    // Set end time for user participation in stream
    const streamParticipantEndTime = await updateStreamParticipantEndTime(streamParticipantId)
    // Disconnect user from room
    twilioClient.video.rooms(twilioRoomSID)
      .participants(twilioParticipantSID)
      .update({status: 'disconnected'})
      .then(participant => {
        console.log(participant.status)
      })
    // Broadcast stream leave to active sockets
    const socket = app.get('io')
    broadcastStreamLeaves(accountId, streamId, socket, 'leave_stream')
    return {
      streamId: streamId,
      accountId: accountId,
      participantEndTime: streamParticipantEndTime.endTime,
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

async function createStreamReminder(info){
  try{
    const streamReminder = await insertStreamReminder(info)
    return streamReminder
  } catch (error) {
    throw new Error(error)
  }
}

// Scheduled Stream Reminders
async function sendScheduledStreamReminders(mins){
  try {
    const scheduledStreamsForReminders = await getScheduledStreamsForReminders(mins)
    scheduledStreamsForReminders.map(async (scheduledStreamsForReminder) => {
      const streamId = scheduledStreamsForReminder.id
      const streamStartTime = scheduledStreamsForReminder.startTime
      const topicId = scheduledStreamsForReminder.topicId
      const topicDetails = await getTopicInfo(topicId)
      const streamReminders = await getStreamReminders(streamId)
      streamReminders.map(async (streamReminder) => {
        const accountId = streamReminder.accountId
        const accountDetails = await getAccountDetails(accountId)
        const phoneNumber = accountDetails.phone
        const minToStart = Math.ceil((streamStartTime.getTime() - new Date().getTime()) / (1000*60))
        const textMessage = `Above the Clouds Reminder: '${topicDetails.topic}' audio room is starting in ${minToStart} minutes.

        ${webURL}
        `
        sendSMS(phoneNumber, textMessage)
      })
    })
    return
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
  sendScheduledStreamReminders,
  createStreamReminder,
}
