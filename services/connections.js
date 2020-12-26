const { getAccountDetails, getAccountUsername } = require('../models/accounts')
const {
  insertConnection,
  removeConnection,
  insertConnectionEmailOutreach,
  getAccountConnections,
  getConnectionsToAccount,
  getAccountConnectionsEmailOutreach,
  getConnectionsEmailOutreachToAccount,
} = require('../models/connections')

async function getConnections(accountId){
  try {
    const results = {}
    // Get Account Email
    const accountDetails = await getAccountDetails(accountId)
    const accountEmail = accountDetails.email
    // Get Account Connections & reformat object
    const accountConnections = await getAccountConnections(accountId)
    // Get Connections to Account & reformat object
    const connectionsToAccount = await getConnectionsToAccount(accountId)
    const connectionsToAccountDict = Object.assign({}, ...connectionsToAccount.map((x) => ({[x.account_id]: x.created_at})))
    // Get all account ids
    const connections = accountConnections.filter(function(item){
      if (connectionsToAccountDict[item.connection_id]) {
        return item
      }
    })
    const connectionsFrmtd = await Promise.all(connections.map(async (x) => {
      const ts = Math.max(x.created_at.getTime(), connectionsToAccountDict[x.connection_id].getTime())
      const connectionUsername = await getAccountUsername(x.connection_id)
      const connectionDetails = await getAccountDetails(x.connection_id)
      return {
        'accountId':x.connection_id,
        'username':connectionUsername.username,
        'email':connectionDetails.email,
        'ts':ts
      }
    }))
    const sortedConnections = connectionsFrmtd.sort(function(a,b) {
      return b.ts - a.ts
    })
    console.log(accountConnections)
    console.log(connectionsToAccount)
    console.log(connectionsToAccountDict)
    console.log(connections)
    console.log(connectionsFrmtd)
    console.log(sortedConnections)
    return
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {getConnections}
