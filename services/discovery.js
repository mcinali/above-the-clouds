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
} = require('../models/streams')
const { fetchAccountDetailsBasic } = require('../services/accounts')


// Get discovery streams
async function getDiscoveryStreams(accountId){
  try {
    // Get streams account is already active in
    const existingStreams = await getActiveAccountStreams(accountId)
    const existingStreamIds = existingStreams.map(stream => stream.streamId)
    // Get all streams that account created in past 24 hrs
    const createdStreams = await getStreamCreationsForAccount(accountId, 24)
    const createdStreamIds = await Promise.all(createdStreams.map(async (stream) => {
      const activeParticipants = await getStreamParticipants(stream.id)
      if (activeParticipants.length>0){
        return stream.id
      }
    }))
    // Get stream invitations in past 24 hours
    const streamInvitations = await getStreamInvitationsForAccount(accountId, 24)
    // Collect active stream Ids that account has been invited to
    const invitedStreamIds = await Promise.all(streamInvitations.map(async (invitation) => {
      const streamId = invitation.streamId
      const activeParticipants = await getStreamParticipants(streamId)
      if (activeParticipants.length>0){
        return streamId
      }
    }))
    // Get accounts following
    const accountsFollowingRows = await getAccountsFollowing(accountId)
    const accountsFollowing = accountsFollowingRows.map(row => row.accountId)
    // Get active streams for accounts following
    const accountsFollowingStreamIds = await Promise.all(accountsFollowing.map(async (followingAccountId) => {
      const activeStreams = await getActiveAccountStreams(followingAccountId)
      if (activeStreams.length>0){
        return activeStreams[0].streamId
      }
    }))
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
      // Get topic info
      const topicInfo = await getTopicInfo(streamDetails.topicId)
      // Attach topic to stream object
      streamDetails['topic'] = topicInfo.topic
      // Get stream participants
      const streamParticipants = await getStreamParticipants(streamId)
      // Get invitations
      const invitationsToStream = streamInvitations.filter(item => item.streamId==streamId)
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
      // Attached stream participant information to stream object
      return {
        streamId: streamDetails.id,
        creatorId: streamDetails.creatorId,
        topicId: streamDetails.topicId,
        topic: topicInfo.topic,
        isActive: isActive,
        capacity: streamDetails.capacity,
        inviteOnly: streamDetails.inviteOnly,
        startTime: streamDetails.startTime,
        ttlInvitations: invitationsToStream.length,
        participants: {
          ttlParticipants: streamParticipants.length,
          ttlFollowing: followingParticipants.length,
          details: participantsFrmtd,
        }
      }
    }))
    // Sort potential streams
    streamObjects.sort(function(a,b) {
      const isActiveDiff = (a.isActive - b.isActive) * 100
      const invitesDiff = 7 * (a.ttlInvitations - b.ttlInvitations)
      const followingDiff = 2 * (a.participants.ttlFollowing - b.participants.ttlFollowing)
      const startTimeDiff = a.startTime.getTime() / b.startTime.getTime()
      const score = -1 * (isActiveDiff + invitesDiff + followingDiff + 1) * startTimeDiff
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
