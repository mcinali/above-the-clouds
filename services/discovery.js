const {
  getStreamInvitationsForAccount,
  getStreamCreationsForAccount,
} = require('../models/discovery')
const {
  getTopicInfo,
  getRecentTopics
} = require('../models/topics')
const { getAccountsFollowing } = require('../models/follows')
const {
  getStreamParticipants,
  getStreamDetails,
  getActiveAccountStreams,
  getActiveStreamReminders,
} = require('../models/streams')
const { fetchAccountDetailsBasic } = require('../services/accounts')


// Get discovery streams
async function getDiscoveryStreams(accountId){
  try {
    // Get streams account is already active in
    const existingStreams = await getActiveAccountStreams(accountId)
    const existingStreamIds = existingStreams.map(stream => stream.streamId)
    // Get active + future streams that account created in past 1 week
    const createdStreams = await getStreamCreationsForAccount(accountId, 168)
    const createdStreamIds = await Promise.all(createdStreams.map(async (stream) => {
      const activeParticipants = await getStreamParticipants(stream.id)
      if (activeParticipants.length>0 || stream.startTime.getTime() > new Date().getTime()){
        return stream.id
      }
    }))
    // Get stream invitations in past 1 week
    const streamInvitations = await getStreamInvitationsForAccount(accountId, 168)
    // Collect active + future stream Ids that account has been invited to
    const invitedStreamIds = await Promise.all(streamInvitations.map(async (invitation) => {
      const streamId = invitation.streamId
      const streamDetails = await getStreamDetails(streamId)
      const activeParticipants = await getStreamParticipants(streamId)
      if (activeParticipants.length>0 || streamDetails.startTime.getTime() > new Date().getTime()){
        return streamId
      }
    }))
    // Get accounts following
    const accountsFollowingRows = await getAccountsFollowing(accountId)
    const accountsFollowing = accountsFollowingRows.map(row => row.accountId)
    // Get active + future streams for accounts following
    const accountsFollowingStreamIdsStacked = await Promise.all(accountsFollowing.map(async (followingAccountId) => {
      const activeStreams = await getActiveAccountStreams(followingAccountId)
      const createdStreams = await getStreamCreationsForAccount(followingAccountId, 168)
      const futureStreams = createdStreams.filter(createdStream => createdStream.startTime.getTime() > new Date().getTime())
      const streamIds = [... new Set(activeStreams.map(activeStream => activeStream.streamId).concat(futureStreams.map(futureStream => futureStream.id)))]
      const streamOptionsDetails = await Promise.all(streamIds.map(async (id) => {
        return await getStreamDetails(id)
      }))
      // Filter out inviteOnly streams
      const streamOptionsFltrd = streamOptionsDetails.filter(stream => !stream.inviteOnly)
      return streamOptionsFltrd.map(option => option.id)
    }))
    const accountsFollowingStreamIds = accountsFollowingStreamIdsStacked.flat()
    // Collect all accessible stream Ids in Set
    const combinedStreamIds = existingStreamIds.concat(createdStreamIds).concat(invitedStreamIds).concat(accountsFollowingStreamIds)
    // Filter null/undefined streamIds
    const combinedStreamIdsFltrd = combinedStreamIds.filter(x => x != null)
    // Create a unique set of non-null streamIds
    const streamIdsSet = new Set(combinedStreamIdsFltrd)
    const streamIds = [...streamIdsSet]
    // Collate stream info for return object/ranking
    const streamObjects = await Promise.all(streamIds.map(async (streamId) => {
      // Get stream details
      const streamDetails = await getStreamDetails(streamId)
      // Get creator account info
      const creatorAccountDetails = await fetchAccountDetailsBasic(streamDetails.creatorId)
      // Get topic info
      const topicInfo = await getTopicInfo(streamDetails.topicId)
      // Attach topic to stream object
      streamDetails['topic'] = topicInfo.topic
      // Get stream participants
      const streamParticipants = await getStreamParticipants(streamId)
      // Get following participants
      const followingParticipants = streamParticipants.filter(participant => accountsFollowing.includes(participant.accountId))
      // Check if user is active in stream
      const isActive = (existingStreamIds.includes(streamId)) ? 1 : 0
      // Create return object
      // Format participant objects
      const participantsFrmtd = await Promise.all(streamParticipants.map(async (participant) => {
        const participantAccountDetails = await fetchAccountDetailsBasic(participant.accountId)
        const following = accountsFollowing.filter(followingAccountId => followingAccountId==participant.accountId)
        participantAccountDetails['following'] = (following.length>0) ? true : (participant.accountId==accountId) ? null : false
        return participantAccountDetails
      }))
      // Get invitations
      const invitationsToStream = streamInvitations.filter(item => item.streamId==streamId)
      // Get stream reminders
      const streamReminders = await getActiveStreamReminders(streamId)
      const streamReminderAccountIds = streamReminders.map(streamReminder => streamReminder.accountId)
      // Format stream reminder accounts
      const streamReminderAccountsFrmtd = await Promise.all(streamReminderAccountIds.map(async (streamReminderAccountId) => {
        return await fetchAccountDetailsBasic(streamReminderAccountId)
      }))
      // Attached stream participant information to stream object
      return {
        streamId: streamDetails.id,
        creator: creatorAccountDetails,
        topicId: streamDetails.topicId,
        topic: topicInfo.topic,
        isActive: isActive,
        capacity: streamDetails.capacity,
        inviteOnly: streamDetails.inviteOnly,
        startTime: streamDetails.startTime,
        createdAt: streamDetails.createdAt,
        ttlInvitations: invitationsToStream.length,
        participants: {
          ttlParticipants: streamParticipants.length,
          ttlFollowing: followingParticipants.length,
          details: participantsFrmtd,
        },
        reminders: streamReminderAccountsFrmtd,
      }
    }))
    // Sort potential streams
    streamObjects.sort(function(a,b) {
      const isActiveDiff = (a.isActive - b.isActive) + 0.01
      const createdAtDiff = b.createdAt.getTime() / a.createdAt.getTime()
      const score = isActiveDiff * createdAtDiff
      // const invitesDiff = 7 * (a.ttlInvitations - b.ttlInvitations)
      // const followingDiff = 2 * (a.participants.ttlFollowing - b.participants.ttlFollowing)
      // const startTimeDiff = a.startTime.getTime() / b.startTime.getTime()
      // const score = (isActiveDiff + invitesDiff + followingDiff + 1) * (startTimeDiff - 1)
      return score
    })
    return streamObjects
  } catch (error){
    throw new Error(error)
  }

}

module.exports = {
  getDiscoveryStreams,
}
