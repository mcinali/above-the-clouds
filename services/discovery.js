const { getActiveStreamInvitationsForAccount, getActivePublicStreams } = require('../models/discovery')
const { getAccountConnections, getConnectionsToAccount } = require('../models/connections')
const { getActiveAccountStreams, getStreamDetails } = require('../models/streams')
const { getStreamBasicInfo, getStreamParticipantsInfo } = require('../services/streams')
const { getTopicInfo } = require('../models/topics')

// Get discovery streams
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
      if (connectionsToAccountDict[item.connectionAccountId.toString()]) { return item }
    })
    // Get active streams for connections
    const inNetworkActiveStreams = await Promise.all(connections.map(async (connection) => {
      return await getActiveAccountStreams(connection.connectionAccountId)
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
    const potentialStreams = await Promise.all(potentialStreamIds.map(async function(streamId){
      return await formatStreamOutput(parseInt(streamId), invitesDict, inNetworkStreamDict)
    }))
    // Filter out streams user does not have access to
    const streamsAccessible = potentialStreams.filter(function(stream){
      if (stream.info.speakerAccessibility==='public'){
        return stream
      } else if (stream.info.speakerAccessibility==='invite-only' && stream.info.sumInvites > 0){
        return stream
      } else if (stream.info.speakerAccessibility==='network-only' && stream.info.sumConnections > 0){
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
    const publicStreamsFrmtd = await Promise.all(publicStreamsFltrd.map(async function(stream){
      return await formatStreamOutput(stream.id, invitesDict, inNetworkStreamDict)
    }))
    // Combine public streams with other accessible streams
    const discoveryStreams = streamsAccessible.concat(publicStreamsFrmtd)
    // Sort streams
    discoveryStreams.sort(function(a,b) {
      const invitesDiff = 5 * (a.info.sumInvites - b.info.sumInvites)
      const connectionsDiff = (a.info.sumConnections - b.info.sumConnections)
      const timeDiff = a.info.startTime.getTime() / b.info.startTime.getTime()
      return -1 * (invitesDiff + connectionsDiff + 1) * timeDiff
    })
    return discoveryStreams
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
