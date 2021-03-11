const {
  insertSocketConnection,
  getActiveAccountSocketConnections,
  getRecentAccountSocketConnections,
  updateSocketDisconnection,
} = require('../models/sockets')
const {
  getAccountFollowers,
} = require('../models/follows')
const {
  getStreamInvitations,
  getStreamParticipants,
  getStreamDetails,
} = require('../models/streams')
const { fetchAccountDetailsBasic } = require('../services/accounts')
const { getDiscoveryStreams } = require('../services/discovery')
const { authenticateSocket } = require('../middleware/auth')

// Establish socket connection with client & broadcast user activity
async function establishSockets(io){
  try {
    io.use(async (socket, next) => {
      await authenticateSocket(socket.handshake, {}, next)
    })
    io.on('connection', async (socket) => {
      // Insert socket connection in DB
      const accountId = socket.handshake.auth.accountId
      const socketId = socket.id
      const accountInfo = await fetchAccountDetailsBasic(accountId)
      console.log()
      console.log(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }), ` - Account ${accountId} connected`)
      const socketConnectionInfo = {
        accountId: accountId,
        socketId: socketId,
      }
      // Fetch recent socket connections
      const recentSocketConnections = await getRecentAccountSocketConnections(accountId, 2)
      // Insert socket connection into the DB
      insertSocketConnection(socketConnectionInfo)
      // Emit connections to online followers
      broadcastToFollowers(accountId, socket, 'online', accountInfo)
      if (recentSocketConnections.length==0){
        const message = `${accountInfo.firstname} ${accountInfo.lastname} (${accountInfo.username}) is online`
        const followers = await getAccountFollowers(accountId)
        followers.map(follower => pushNotificationMessage(follower.accountId, message, socket))
      }
      socket.on('disconnect', async () => {
        console.log()
        console.log(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }), ` - Account ${accountId} disconnected`)
        const socketDisconnectionInfo = {
          // Update socket connection table with disconnect info
          accountId: accountId,
          socketId: socketId,
        }
        // Insert socket connection in DB
        await updateSocketDisconnection(socketDisconnectionInfo)
        // Emit disconnect to followers (if no active connections exist)
        const socketConnections = await getActiveAccountSocketConnections(accountId)
        if (!Boolean(socketConnections[0])){
          broadcastToFollowers(accountId, socket, 'offline', accountInfo)
        }
        socket.emit('offline', accountId)
      })
    })
  } catch (error) {
    throw new Error(error)
  }
}

// Helper function to fetch followers and broadcast change to them
async function broadcastToFollowers(accountId, socket, channel, info){
  try {
    const followers = await getAccountFollowers(accountId)
    followers.map(async (follower) => {
      const id = follower.accountId
      const socketConnections = await getActiveAccountSocketConnections(id)
      socketConnections.map(socketConnection => socket.to(socketConnection.socketId).emit(channel, info))
    })
  } catch (error) {
    throw new Error(error)
  }
}

// Helper function to fetch followers and broadcast stream updates to them
async function broadcastStreamJoins(accountId, streamId, socket, channel){
  try {
    // Get stream info
    const streamInfo = await getStreamDetails(streamId)
    // Get invitees & followers
    const followers = await getAccountFollowers(accountId)
    const invitees = await getStreamInvitations(streamId)
    const inviteeAccountIds = [...new Set(invitees.map(invitee => invitee.inviteeAccountId).concat([streamInfo.creatorId]))]
    inviteeAccountIds.map(async (id) => {
      streamJoinsBroadcastHelper(id, streamId, socket, channel)
    })
    if (!streamInfo.inviteOnly){
      followers.map(async (follower) => {
        // Get accountId
        const id = follower.accountId
        if (!invitees.includes(id)){
          streamJoinsBroadcastHelper(id, streamId, socket, channel)
        }
      })
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Helper function to broadcast stream updates
async function streamJoinsBroadcastHelper(acccountId, streamId, socket, channel){
  try {
    // Get active socket connections for accountId
    const socketConnections = await getActiveAccountSocketConnections(acccountId)
    // Get discovery streams
    const discoveryStreams = await getDiscoveryStreams(acccountId)
    discoveryStreams.map(stream => {
      if (stream.streamId==streamId){
        // Broadcast participant details to active sockets
        socketConnections.map(socketConnection => socket.to(socketConnection.socketId).emit(channel, stream))
      }
    })
  } catch (error) {
    throw new Error(error)
  }
}

// Helper function to fetch followers and broadcast stream updates to them
async function broadcastStreamLeaves(accountId, streamId, socket, channel){
  try {
    // Create leave info object
    const leaveInfo = {
      streamId: streamId,
      accountId: accountId,
    }
    // Get stream info
    const streamInfo = await getStreamDetails(streamId)
    // Get invitees + followers
    const followers = await getAccountFollowers(accountId)
    const invitees = await getStreamInvitations(streamId)
    const inviteeAccountIds = [...new Set(invitees.map(invitee => invitee.inviteeAccountId).concat([streamInfo.creatorId]))]
    inviteeAccountIds.map(async (id) => {
      // Get active socket connections for accountId
      const socketConnections = await getActiveAccountSocketConnections(id)
      // Broadcast participant details to active sockets
      socketConnections.map(socketConnection => socket.to(socketConnection.socketId).emit(channel, leaveInfo))
    })
    if (!streamInfo.inviteOnly){
      followers.map(async (follower) => {
        // Get accountId
        const id = follower.accountId
        if (!invitees.includes(id)){
          // Get active socket connections for accountId
          const socketConnections = await getActiveAccountSocketConnections(id)
          // Broadcast participant details to active sockets
          socketConnections.map(socketConnection => socket.to(socketConnection.socketId).emit(channel, leaveInfo))
        }
      })
    }
  } catch (error) {
    throw new Error(error)
  }
}

// Broadcast stream invitation
async function pushNotificationMessage(inviteeAccountId, message, socket){
  try {
    const socketConnections = await getActiveAccountSocketConnections(inviteeAccountId)
    socketConnections.map(socketConnection => socket.to(socketConnection.socketId).emit('notification', message))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  establishSockets,
  broadcastStreamJoins,
  broadcastStreamLeaves,
  pushNotificationMessage,
}
