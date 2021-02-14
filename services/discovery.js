const { getActiveStreamInvitationsForAccount, getActivePublicAccountStreams } = require('../models/discovery')
const { getTopicInfo, getRecentTopics } = require('../models/topics')
const { getAccountsFollowing } = require('../models/follows')
const { getStreamParticipants, getStreamDetails } = require('../models/streams')
const { fetchAccountDetailsBasic } = require('../services/accounts')
// const { getStreamBasicInfo, getStreamParticipantsInfo } = require('../services/streams')


// Get discovery streams
async function getDiscoveryStreams(accountId){
  try {
    // Get topics created in last 12 hours: # participants + # streams
    const recentTopics = await getRecentTopics(12)
    // Get all active streams user was invited to: invited + created_at + # following accounts + # accounts followed by following accounts
    const streamInvitations = await getActiveStreamInvitationsForAccount(accountId)
    // Get all active streams of following accounts: invited + created_at + # following accounts + # accounts followed by following accounts
    const accountsFollowingRows = await getAccountsFollowing(accountId)
    const accountsFollowing = accountsFollowingRows.map(row => row.accountId)
    const accountsFollowingStreams = await Promise.all(accountsFollowing.map(async (followingAccountId) => {
      return await getActivePublicAccountStreams(followingAccountId)
    }))
    // Get all active streams of accounts followed by accounts: invited + created_at + # following accounts + # accounts followed by following accounts
    const accountsFollowedByFollowingSet = new Set([])
    await Promise.all(accountsFollowing.map(async (followedByFollowingAccountId) => {
      const accountRows = await getAccountsFollowing(followedByFollowingAccountId)
      accountRows.map(row => {
        accountsFollowedByFollowingSet.add(row.accountId)
      })
    }))
    const accountsFollowedByFollowing = [...accountsFollowedByFollowingSet]
    const accountsFollowedByFollowingFltrd = accountsFollowedByFollowing.filter(followedByFollowingAccountId => !accountsFollowing.includes(followedByFollowingAccountId))
    const accountsFollowedByFollowingStreams = await Promise.all(accountsFollowedByFollowingFltrd.map(async (followedByFollowingAccountId) => {
      return await getActivePublicAccountStreams(followedByFollowingAccountId)
    }))
    // Collect all accessible stream Ids
    const streamIdsSet = new Set([])
    streamInvitations.map(item => streamIdsSet.add(item.streamId))
    accountsFollowingStreams.flat().map(item => streamIdsSet.add(item.streamId))
    accountsFollowedByFollowingStreams.flat().map(item => streamIdsSet.add(item.streamId))
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
      const followingParticipants = accountsFollowingStreams.flat().filter(item => item.streamId==streamId)
      // Get following's following participants
      const followedByFollowingParticipants = accountsFollowedByFollowingStreams.flat().filter(item => item.streamId==streamId)
      // Create return object
      // Format participant objects
      const participantsFrmtd = await Promise.all(streamParticipants.map(async (participant) => {
        const participantAccountDetails = await fetchAccountDetailsBasic(participant.accountId)
        const following = accountsFollowing.filter(followingAccountId => followingAccountId==participant.accountId)
        const followedByFollowing = accountsFollowedByFollowingFltrd.filter(followedByFollowingAccountId => followedByFollowingAccountId==participant.accountId)
        participantAccountDetails['following'] = (following.length>0) ? true : false
        participantAccountDetails['followedByFollowing'] = (followedByFollowing.length>0) ? true : false
        return participantAccountDetails
      }))
      // Attached stream participant information to stream object
      return {
        streamId: streamDetails.id,
        creatorId: streamDetails.creatorId,
        topicId: streamDetails.topicId,
        topic: topicInfo.topic,
        capacity: streamDetails.capacity,
        inviteOnly: streamDetails.inviteOnly,
        startTime: streamDetails.startTime,
        ttlInvitations: invitationsToStream.length,
        participants: {
          ttlParticipants: streamParticipants.length,
          ttlFollowing: followingParticipants.length,
          ttlFollowedByFollowing: followedByFollowingParticipants.length,
          details: participantsFrmtd,
        }
      }
    }))
    // Fetch & format unseen recent topics
    const recentUnseenTopics = recentTopics.map(topic => {
      const fltrdStreams = streamObjects.filter(streamObject => streamObject.topicId==topic.id)
      if (fltrdStreams.length==0) {
        return {
          streamId: null,
          creatorId: topic.accountId,
          topicId: topic.id,
          topic: topic.topic,
          startTime: topic.createdAt,
          ttlInvitations: 0,
          participants: {
            ttlParticipants: 0,
            ttlFollowing: 0,
            ttlFollowedByFollowing: 0,
            details: []
          },
        }
      }
    })
    const recentUnseenTopicsFltrd = recentUnseenTopics.filter(item => Boolean(item))
    // Concat stream objects + unseen recent topics
    const returnObjects = streamObjects.concat(recentUnseenTopicsFltrd)
    // Sort potential streams
    returnObjects.sort(function(a,b) {
      const invitesDiff = 7 * (a.ttlInvitations - b.ttlInvitations)
      const followingDiff = 2 * (a.participants.ttlFollowing - b.participants.ttlFollowing)
      const followedByFollowingDiff = 0.5 * (a.participants.ttlFollowedByFollowing - b.participants.ttlFollowedByFollowing)
      const startTimeDiff = a.startTime.getTime() / b.startTime.getTime()
      const score = -1 * (invitesDiff + followingDiff + followedByFollowingDiff + 1) * startTimeDiff
      return score
    })
    return returnObjects
  } catch (error){
    throw new Error(error)
  }

}

async function formatStreamOutput(streamId, invitesDict, inNetworkStreamDict){
  const streamBasicInfo = await getStreamBasicInfo(streamId)
  streamBasicInfo['sumInvites'] = (invitesDict[streamId]) ? (invitesDict[streamId]) : null
  streamBasicInfo['sumConnections'] = (inNetworkStreamDict[streamId]) ? inNetworkStreamDict[streamId] : null
  const streamParticipantInfo = await getStreamParticipantsInfo(streamId)
  return {
    'info': streamBasicInfo,
    'participants': streamParticipantInfo,
  }
}

module.exports = {
  getDiscoveryStreams,
}
