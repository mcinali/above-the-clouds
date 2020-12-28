const { getActiveStreamInvitationsForAccount, getActivePublicStreams } = require('../models/discovery')
const { getAccountConnections, getConnectionsToAccount } = require('../models/connections')
const { getActiveAccountStreams, getStreamDetails } = require('../models/streams')

// - Active streams only
// - Invited first
// - Network second
// - Public third
// - Other factors:
// -- time elapsed (mins)
// -- # people
// -- # connections

async function getDiscoveryStreams(accountId){
  try {
    // Get active streams user was invited to
    const streamInvites = await getActiveStreamInvitationsForAccount(accountId)
    const invitesDict = {}
    const inviteReducer = (accumulator, currentValue) => {
      if (accumulator[currentValue['streamId']]){
        accumulator[currentValue['streamId']] = accumulator[currentValue['streamId']] + 1
      } else {
        accumulator[currentValue['streamId']] = 1
      }
      return accumulator
    }
    streamInvites.reduce(inviteReducer,invitesDict)
    // Get account connections
    const accountConnections = await getAccountConnections(accountId)
    const connectionsToAccount = await getConnectionsToAccount(accountId)
    const connectionsToAccountDict = Object.assign({}, ...connectionsToAccount.map((x) => ({[x.accountId]: x.createdAt})))
    const connections = accountConnections.filter(function(item){
      if (connectionsToAccountDict[item.connectionId]) { return item }
    })
    // Get active streams for connections
    const inNetworkActiveStreams = await Promise.all(connections.map(async (connection) => {
      return await getActiveAccountStreams(connection.connectionId)
    }))
    const inNetworkActiveStreamsFlat = inNetworkActiveStreams.flat()
    const inNetworkStreamDict = {}
    const inNetworkReducer = (accumulator, currentValue) => {
      if (accumulator[currentValue['streamId']]){
        accumulator[currentValue['streamId']] = accumulator[currentValue['streamId']] + 1
      } else {
        accumulator[currentValue['streamId']] = 1
      }
      return accumulator
    }
    inNetworkActiveStreamsFlat.reduce(inNetworkReducer,inNetworkStreamDict)
    const potentialStreamIds = [...new Set(Object.keys(invitesDict).concat(Object.keys(inNetworkStreamDict)))]
    const potentialStreams = await Promise.all(potentialStreamIds.map(async (streamId) => {
      const stream = await getStreamDetails(streamId)
      return {
        'streamId':parseInt(streamId),
        'topicId':stream.topicId,
        'creatorId':stream.creatorId,
        'speakerAccessibility':stream.speakerAccessibility,
        'startTime':stream.startTime,
        'sumInvites':(invitesDict[streamId]) ? (invitesDict[streamId]) : null,
        'sumConnections':(inNetworkStreamDict[streamId]) ? inNetworkStreamDict[streamId] : null,
      }
    }))
    // Filter out streams user does not have access to
    const streamsAccessible = potentialStreams.filter(function(stream){
      if (stream.speakerAccessibility==='public'){
        return stream
      } else if (stream.speakerAccessibility==='invite-only' && stream.sumInvites > 0){
        return stream
      } else if (stream.speakerAccessibility==='network-only' && stream.sumConnections > 0){
        return stream
      }
    })
    // Get public streams
    const limit = 25 - streamsAccessible.length
    const publicStreams = await getActivePublicStreams(limit)
    // Filter out streams already included
    const publicStreamsFltrd = publicStreams.filter(function(stream){
      if (!potentialStreamIds.includes(stream.id.toString())){
        return stream
      }
    })
    // Format stream details
    const publicStreamsFrmtd = publicStreamsFltrd.map(stream => {
      return {
        'streamId':stream.id,
        'topicId':stream.topicId,
        'creatorId':stream.creatorId,
        'speakerAccessibility':stream.speakerAccessibility,
        'startTime':stream.startTime,
        'sumInvites':null,
        'sumConnections':null,
      }
    })
    // Combine public streams with other accessible streams
    const discoveryStreams = streamsAccessible.concat(publicStreamsFrmtd)
    // Sort streams
    discoveryStreams.sort(function(a,b) {
      const invitesDiff = 5 * (a.sumInvites - b.sumInvites)
      const connectionsDiff = (a.sumConnections - b.sumConnections)
      const timeDiff = a.startTime.getTime() / b.startTime.getTime()
      return -1 * (invitesDiff + connectionsDiff + 1) * timeDiff
    })
    return discoveryStreams
  } catch (error){
    throw new Error(error)
  }

}

module.exports = {
  getDiscoveryStreams,
}
