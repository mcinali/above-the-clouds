const {
  insertSocketConnection,
  getAccountSocketConnections,
  updateSocketDisconnection,
} = require('../models/sockets')
const { getAccountFollowers } = require('../models/follows')
const { getStreamInvitations } = require('../models/streams')
const { fetchAccountDetailsBasic } = require('../services/accounts')
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
      insertSocketConnection(socketConnectionInfo)
      // Emit connections to online followers
      broadcastToFollowers(accountId, socket, 'online', accountInfo)
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
        const socketConnections = await getAccountSocketConnections(accountId, 1)
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
      const socketConnections = await getAccountSocketConnections(id, 24)
      socketConnections.map(socketConnection => socket.to(socketConnection.socketId).emit(channel, info))
    })
  } catch (error) {
    throw new Error(error)
  }
}

// Helper function to fetch stream invitees and broadcast change to them
async function broadcastToInvitees(streamId, socket, channel, info){
  try {
    const invitees = await getStreamInvitations(streamId)
    invitees.map(async (invitee) => {
      const id = invitee.inviteeAccountId
      const socketConnections = await getAccountSocketConnections(id, 24)
      socketConnections.map(socketConnection => socket.to(socketConnection.socketId).emit(channel, info))
    })
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  establishSockets,
  broadcastToFollowers,
  broadcastToInvitees,
}
