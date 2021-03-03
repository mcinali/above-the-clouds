const {
  insertSocketConnection,
  getAccountSocketConnections,
  updateSocketDisconnection,
} = require('../models/sockets')
const { getAccountFollowers } = require('../models/follows')
const { fetchAccountDetailsBasic } = require('../services/accounts')

async function establishSockets(io){
  try {
    io.on('connection', async (socket) => {
      // Insert socket connection in DB
      const accountId = socket.request._query.accountId
      const socketId = socket.id
      console.log()
      console.log(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }), ` - Account ${accountId} connected`)
      const socketConnectionInfo = {
        accountId: accountId,
        socketId: socketId,
      }
      insertSocketConnection(socketConnectionInfo)
      // Emit connections to online followers
      broadcastToFollowers(accountId, socket, 'online')
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
          broadcastToFollowers(accountId, socket, 'offline')
        }
        socket.emit('offline', accountId)
      })
    })
  } catch (error) {

  }
}

// Helper function to fetch followers and broadcast status change to them
async function broadcastToFollowers(accountId, socket, channel){
  try {
    const followers = await getAccountFollowers(accountId)
    followers.map(async (follower) => {
      const id = follower.accountId
      const socketConnections = await getAccountSocketConnections(id, 24)
      if (Boolean(socketConnections[0])){
        const accountInfo = await fetchAccountDetailsBasic(id)
        socketConnections.map(socketConnection => socket.broadcast.to(socketConnection.socketId).emit(channel, accountInfo))
      }
    })
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  establishSockets,
}
